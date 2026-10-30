let ngWords = [];

// 強制非表示用のCSSをDOMに注入
const style = document.createElement("style");
style.id = "bguru-filter-style";
style.textContent = `
  div[data-post-id][data-bguru-hidden="true"],
  [data-bguru-hidden="true"] {
    display: none !important;
  }
`;
document.head.appendChild(style);

// 文字列を正規化して小文字化
function normalizeText(text) {
  if (!text) return "";
  return text.normalize("NFKC").toLowerCase().trim();
}

// ストレージからNGワードを読み込み
chrome.storage.sync.get({ ngWords: [] }, (data) => {
  ngWords = (data.ngWords || []).map((w) => normalizeText(w)).filter(Boolean);
  console.log("[B-guru Filter] 読み込まれたNGワード:", ngWords);
  filterAllPosts();
});

// ポップアップ側でNGワードが変更されたら即座に再判定
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.ngWords) {
    ngWords = (changes.ngWords.newValue || [])
      .map((w) => normalizeText(w))
      .filter(Boolean);
    console.log("[B-guru Filter] NGワードが更新されました:", ngWords);
    filterAllPosts();
  }
});

// 1つのポスト（[data-post-id]）を検査
function filterPost(postEl) {
  if (!postEl) return;

  // content-visibility: auto の影響を受けないよう textContent を使用
  const rawText = postEl.textContent || "";
  const normalized = normalizeText(rawText);

  if (!normalized) return;

  // NGワードに一致するかチェック
  const matchedWord = ngWords.find((word) => normalized.includes(word));

  if (matchedWord) {
    if (!postEl.hasAttribute("data-bguru-hidden")) {
      const postId = postEl.getAttribute("data-post-id") || "unknown";
      console.log(
        `[B-guru Filter] ポスト (ID: ${postId}) を非表示にしました。ヒットしたワード: "${matchedWord}"`
      );
    }
    postEl.setAttribute("data-bguru-hidden", "true");
  } else {
    // NGワードを削除した場合は表示を復元
    if (postEl.hasAttribute("data-bguru-hidden")) {
      postEl.removeAttribute("data-bguru-hidden");
    }
  }
}

// 画面内の全ポストを検査
function filterAllPosts() {
  const posts = document.querySelectorAll("div[data-post-id]");
  posts.forEach(filterPost);
}

// スクロールや仮想DOMによるDOMノードの追加を監視
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

// Reactの仮想DOM再マウント・スクロール対策として定期再スキャンも実施（1秒間隔）
setInterval(filterAllPosts, 1000);
