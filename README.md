# SecurityTrails-Subdscraper

*SecurityTrails-Subdscraper is a Chrome extension that automates subdomain discovery from web pages while intelligently handling pagination and Cloudflare challenges. It's designed for security professionals and researchers.*

## Features

- 🕵️‍♂️ **Automated Subdomain Extraction** - Regex-based scraping from any webpage
- 🔄 **Smart Pagination Handling** - Auto-navigates through SecurityTrails and similar sites
- 🛡️ **Cloudflare Challenge Detection** - Pauses when CAPTCHAs are detected
- 💾 **Multiple Export Options** - Save to file or copy to clipboard
- ⏱️ **Human-like Browsing** - Randomized delays between requests (15-30s)

## Installation

### Method 1: Load Unpacked
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select the extension folder

### Method 2: Chrome Web Store
*Coming soon...*

## Usage

1. **Navigate** to your target website (e.g., SecurityTrails)
2. **Click** the extension icon in your toolbar
3. **Enter** the target domain (e.g., `example.com`)
4. **Choose mode**:
   - 🟢 **Extract** - Scrape current page only
   - 🔵 **Start** - Begin automated pagination
   - 🔴 **Stop** - Pause automation
5. **Manage results**:
   - 💾 Save to `.txt` file
   - 📋 Copy to clipboard
   - 🗑️ Clear collected data
