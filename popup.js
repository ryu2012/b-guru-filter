const wordInput = document.getElementById("wordInput");
const addBtn = document.getElementById("addBtn");
const wordList = document.getElementById("wordList");

function renderList(words) {
  wordList.innerHTML = "";
  if (!words || words.length === 0) {
    wordList.innerHTML = '<div class="empty-msg">NGワードは登録されていません</div>';
    return;
  }

  words.forEach((word, index) => {
    const li = document.createElement("li");
    li.textContent = word;

    const del = document.createElement("button");
    del.className = "del-btn";
    del.textContent = "×";
    del.title = "削除";
    del.onclick = () => removeWord(index);

    li.appendChild(del);
    wordList.appendChild(li);
  });
}

function loadWords() {
  chrome.storage.sync.get({ ngWords: [] }, (data) => renderList(data.ngWords));
}

function addWord() {
  const word = wordInput.value.trim();
  if (!word) return;

  chrome.storage.sync.get({ ngWords: [] }, (data) => {
    const words = data.ngWords || [];
    if (!words.includes(word)) {
      words.push(word);
      chrome.storage.sync.set({ ngWords: words }, () => {
        wordInput.value = "";
        renderList(words);
      });
    }
  });
}

function removeWord(index) {
  chrome.storage.sync.get({ ngWords: [] }, (data) => {
    const words = data.ngWords || [];
    words.splice(index, 1);
    chrome.storage.sync.set({ ngWords: words }, () => renderList(words));
  });
}

addBtn.addEventListener("click", addWord);
wordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addWord();
});

loadWords();
