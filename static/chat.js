const dummyData = [
  { user: "Alice", message: "Hello there!" },
  { user: "Bob", message: "Hi Alice!" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
  { user: "Alice", message: "How are you doing?" },
];

const time = [
  2000, 2000, 2000, 2000, 2000, 2200, 2000, 2000, 2000, 5000, 5000, 5000, 5, 5,
  5, 3, 5, 5, 5, 5, 5, 5, 5,
];
const color = [
  "blue",
  "green",
  "blue",
  "blue",
  "blue",
  "blue",
  "blue",
  "blue",
  "orange",
];

// 메세지 출력
function appendMessage(user, message, color) {
  const chatMessages = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.innerHTML = `<span class="user" style="color: ${color};">${user}:</span> ${message}`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight; // 스크롤을 항상 아래로 유지
}

// 더미데이타 정보 보내기
function displayDummyData() {
  let index = 0;
  const intervalId = setInterval(() => {
    if (index < dummyData.length) {
      const { user, message } = dummyData[index];
      const userColor = color[index];
      appendMessage(user, message, userColor);
      index++;
    } else {
      clearInterval(intervalId);
    }
  }, time[index]);
}

function handleKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // 엔터 키 기본 동작 방지
    sendMessage(); // 메시지 전송
  }
}

// 초기 실행
displayDummyData();

function moveToNextPage() {
  // 여기에 이동할 페이지의 URL을 입력하세요.
  var nextPageUrl = "다음페이지의URL.html";

  // 페이지 이동
  window.location.href = nextPageUrl;
}
