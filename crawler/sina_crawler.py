import re
import time
import requests
from urllib.parse import urljoin, urlparse
from datetime import datetime
from bs4 import BeautifulSoup
import sqlite3
import json

from config import Config


class SinaNewsCrawler:
    def __init__(self):
        self.headers = Config.REQUEST_HEADERS
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def get_page(self, url, retries=Config.REQUEST_RETRY_TIMES):
        for i in range(retries):
            try:
                response = self.session.get(
                    url,
                    timeout=Config.REQUEST_TIMEOUT,
                    allow_redirects=True
                )
                response.encoding = 'utf-8'
                if response.status_code == 200:
                    return response.text
            except requests.RequestException as e:
                print(f"请求失败 ({i+1}/{retries}): {url} - {e}")
                time.sleep(Config.REQUEST_RETRY_DELAY)
        return None

    def extract_news_links(self, html, base_url):
        soup = BeautifulSoup(html, 'lxml')
        links = set()

        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            full_url = urljoin(base_url, href)

            if self._is_valid_news_url(full_url):
                links.add(full_url)

        return list(links)

    def _is_valid_news_url(self, url):
        parsed = urlparse(url)

        if 'sina.com.cn' not in parsed.netloc:
            return False

        if re.search(r'\.(shtml|html|shtm)$', parsed.path):
            return True

        if re.search(r'doc-\w+', parsed.path):
            return True

        return False

    def parse_news_detail(self, html, url):
        soup = BeautifulSoup(html, 'lxml')

        title = self._extract_title(soup)
        if not title:
            return None

        content, images, videos = self._extract_content(soup)

        publish_time = self._extract_publish_time(soup)
        source = self._extract_source(soup)
        summary = self._extract_summary(soup, content)
        category = self._extract_category(url)

        return {
            'title': title,
            'content': content,
            'summary': summary,
            'source': source,
            'source_url': url,
            'category': category,
            'publish_time': publish_time,
            'images': images,
            'videos': videos,
            'crawl_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

    def _extract_title(self, soup):
        title_selectors = [
            'h1.main-title',
            'h1#artibodyTitle',
            'h1.title',
            '.main-title h1',
            'h1'
        ]

        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                title = title_elem.get_text(strip=True)
                if title and len(title) > 5:
                    return title
        return None

    def _extract_content(self, soup):
        content_selectors = [
            '#artibody',
            '.article-content',
            '.article-body',
            '#articleContent',
            '.main-content'
        ]

        content_elem = None
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                break

        if not content_elem:
            return "", [], []

        for script in content_elem.find_all('script'):
            script.decompose()
        for style in content_elem.find_all('style'):
            style.decompose()
        for ad in content_elem.find_all(class_=re.compile(r'ad|advert|adsbygoogle')):
            ad.decompose()

        images = []
        for img in content_elem.find_all('img'):
            src = img.get('src') or img.get('data-src')
            if src:
                images.append(src)
                img['src'] = src

        videos = []
        for video in content_elem.find_all('video'):
            src = video.get('src')
            if src:
                videos.append(src)

        for iframe in content_elem.find_all('iframe'):
            src = iframe.get('src')
            if src and ('video' in src or 'player' in src):
                videos.append(src)

        content_html = str(content_elem)

        content_text = content_elem.get_text(separator='\n', strip=True)

        return content_html, images, videos

    def _extract_publish_time(self, soup):
        time_selectors = [
            '.date',
            '.time',
            '.pub-time',
            '#pub_date',
            '.article-date',
            'span.date'
        ]

        for selector in time_selectors:
            time_elem = soup.select_one(selector)
            if time_elem:
                time_text = time_elem.get_text(strip=True)
                parsed_time = self._parse_time_string(time_text)
                if parsed_time:
                    return parsed_time

        time_patterns = [
            r'(\d{4}年\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{1,2})',
            r'(\d{4}-\d{1,2}-\d{1,2}\s*\d{1,2}:\d{1,2})',
            r'(\d{4}/\d{1,2}/\d{1,2}\s*\d{1,2}:\d{1,2})',
        ]

        html_str = str(soup)
        for pattern in time_patterns:
            match = re.search(pattern, html_str)
            if match:
                parsed_time = self._parse_time_string(match.group(1))
                if parsed_time:
                    return parsed_time

        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    def _parse_time_string(self, time_str):
        formats = [
            '%Y年%m月%d日 %H:%M',
            '%Y年%m月%d日%H:%M',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%Y/%m/%d %H:%M',
            '%Y/%m/%d %H:%M:%S',
        ]

        time_str = time_str.strip()
        for fmt in formats:
            try:
                dt = datetime.strptime(time_str, fmt)
                return dt.strftime('%Y-%m-%d %H:%M:%S')
            except ValueError:
                continue
        return None

    def _extract_source(self, soup):
        source_selectors = [
            '.source',
            '.media_name',
            '.article-source',
            '#media_name',
            'span.source'
        ]

        for selector in source_selectors:
            source_elem = soup.select_one(selector)
            if source_elem:
                source = source_elem.get_text(strip=True)
                if source:
                    return source.replace('来源：', '').replace('来源:', '')

        return '新浪新闻'

    def _extract_summary(self, soup, content):
        meta_summary = soup.find('meta', attrs={'name': 'description'})
        if meta_summary:
            summary = meta_summary.get('content', '')
            if summary and len(summary) > 10:
                return summary

        content_text = re.sub(r'<[^>]+>', '', content)
        content_text = re.sub(r'\s+', ' ', content_text).strip()

        if len(content_text) > 200:
            return content_text[:200] + '...'
        return content_text

    def _extract_category(self, url):
        for key, category in Config.SINA_NEWS_CATEGORIES.items():
            if key in url:
                return category

        parsed = urlparse(url)
        path = parsed.path

        category_map = {
            'tech': '科技',
            'sports': '体育',
            'ent': '娱乐',
            'finance': '财经',
            'politics': '政治',
            'society': '社会',
            'edu': '教育',
            'health': '健康',
            'china': '政治',
            'world': '国际',
        }

        for key, category in category_map.items():
            if key in path:
                return category

        return '综合'

    def crawl_category(self, category_key, max_news=20):
        category_name = Config.SINA_NEWS_CATEGORIES.get(category_key, '综合')
        category_url = Config.SINA_NEWS_URLS.get(category_key)

        if not category_url:
            print(f"无效的分类: {category_key}")
            return []

        print(f"开始爬取分类: {category_name} ({category_url})")

        html = self.get_page(category_url)
        if not html:
            print(f"获取分类页面失败: {category_url}")
            return []

        news_links = self.extract_news_links(html, category_url)
        print(f"找到 {len(news_links)} 条新闻链接")

        news_list = []
        for i, link in enumerate(news_links[:max_news]):
            print(f"正在爬取 ({i+1}/{min(len(news_links), max_news)}): {link}")

            detail_html = self.get_page(link)
            if not detail_html:
                continue

            news_data = self.parse_news_detail(detail_html, link)
            if news_data:
                news_data['category'] = category_name
                news_list.append(news_data)
                print(f"成功解析: {news_data['title'][:30]}...")

            time.sleep(0.5)

        print(f"分类 {category_name} 爬取完成，共获取 {len(news_list)} 条新闻")
        return news_list

    def crawl_all_categories(self, max_per_category=10):
        all_news = []

        for category_key in Config.SINA_NEWS_CATEGORIES.keys():
            try:
                news_list = self.crawl_category(category_key, max_per_category)
                all_news.extend(news_list)
            except Exception as e:
                print(f"爬取分类 {category_key} 时出错: {e}")

        print(f"全部爬取完成，共获取 {len(all_news)} 条新闻")
        return all_news


class NewsDatabase:
    def __init__(self, db_path):
        self.db_path = db_path
        self._ensure_db_directory()

    def _ensure_db_directory(self):
        import os
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)

    def save_news(self, news_data):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute('''
                SELECT id FROM news WHERE source_url = ?
            ''', (news_data['source_url'],))

            if cursor.fetchone():
                print(f"新闻已存在，跳过: {news_data['title'][:30]}...")
                return None

            cursor.execute('''
                INSERT INTO news (title, content, summary, source, source_url, category, 
                                  publish_time, view_count, comment_count, hot_score, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
            ''', (
                news_data['title'],
                news_data['content'],
                news_data['summary'],
                news_data['source'],
                news_data['source_url'],
                news_data['category'],
                news_data['publish_time'],
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ))

            news_id = cursor.lastrowid

            cursor.execute('''
                SELECT id FROM tag WHERE name = ?
            ''', (news_data['category'],))

            tag_row = cursor.fetchone()
            if tag_row:
                tag_id = tag_row[0]
            else:
                cursor.execute('''
                    INSERT INTO tag (name, created_at, updated_at)
                    VALUES (?, ?, ?)
                ''', (
                    news_data['category'],
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                ))
                tag_id = cursor.lastrowid

            cursor.execute('''
                INSERT OR IGNORE INTO news_tag (news_id, tag_id)
                VALUES (?, ?)
            ''', (news_id, tag_id))

            conn.commit()
            print(f"新闻保存成功: {news_data['title'][:30]}...")
            return news_id

        except Exception as e:
            conn.rollback()
            print(f"保存新闻失败: {e}")
            return None
        finally:
            conn.close()

    def save_news_batch(self, news_list):
        saved_count = 0
        for news in news_list:
            news_id = self.save_news(news)
            if news_id:
                saved_count += 1
        print(f"批量保存完成，共保存 {saved_count} 条新闻")
        return saved_count


def main():
    import argparse

    parser = argparse.ArgumentParser(description='新浪新闻爬虫')
    parser.add_argument('-c', '--category', help='指定爬取的分类')
    parser.add_argument('-n', '--number', type=int, default=10, help='每个分类爬取数量')
    parser.add_argument('--all', action='store_true', help='爬取所有分类')

    args = parser.parse_args()

    crawler = SinaNewsCrawler()
    db = NewsDatabase(Config.DATABASE_CONFIG['sqlite_path'])

    if args.all:
        print("开始爬取所有分类...")
        news_list = crawler.crawl_all_categories(args.number)
        db.save_news_batch(news_list)
    elif args.category:
        print(f"开始爬取分类: {args.category}")
        news_list = crawler.crawl_category(args.category, args.number)
        db.save_news_batch(news_list)
    else:
        print("默认爬取科技分类...")
        news_list = crawler.crawl_category('tech', args.number)
        db.save_news_batch(news_list)

    print("爬取任务完成！")


if __name__ == '__main__':
    main()
