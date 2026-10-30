let ngWords = [];

// ストレージからNGワードを読み込み
chrome.storage.sync.get({ ngWords: [] }, (data) => {
  ngWords = data.ngWords;
  filterAllPosts();
});

// ポップアップ側でNGワードが変更されたら即座に再判定
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.ngWords) {
    ngWords = changes.ngWords.newValue || [];
    filterAllPosts();
  }
});

// 1つのポスト（[data-post-id]）を検査してフィルタリング
function filterPost(postEl) {
  if (!postEl) return;

  // 投稿全体のテキスト（本文 .post-body だけでなくOGPカードのタイトル等も含む）を取得
  const text = (postEl.innerText || "").toLowerCase();

  // NGワードに一致するかチェック（大文字小文字を区別せず部分一致）
  const isBlocked = ngWords.some(
    (word) => word && text.includes(word.toLowerCase())
  );

  if (isBlocked) {
    postEl.style.display = "none";
  } else {
    // NGワードを削除した際に元に戻せるようにする
    if (postEl.style.display === "none") {
      postEl.style.display = "";
    }
  }
}

// 画面内の全ポストを検査
function filterAllPosts() {
  const posts = document.querySelectorAll("div[data-post-id]");
  posts.forEach(filterPost);
}

// スクロールや自動更新で新しく追加されるポストを監視
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches && node.matches("div[data-post-id]")) {
          filterPost(node);
        } else if (node.querySelectorAll) {
          const subPosts = node.querySelectorAll("div[data-post-id]");
          subPosts.forEach(filterPost);
        }
      }
    });
  }
});

observer.observe(document.body, { childList: true, subtree: true });
