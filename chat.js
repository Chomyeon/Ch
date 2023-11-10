
const dummyData = [
    { user: "Alice", message: "Hello there!" },
    { user: "Bob", message: "Hi Alice!" },
    { user: "Alice", message: "How are you doing?" },
    // 추가 데이터를 필요에 따라 여기에 계속 추가할 수 있습니다.
  ];

  // 채팅을 화면에 추가하는 함수
  function appendMessage(user, message) {
    const chatMessages = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.innerHTML = `<span class="user">${user}:</span> ${message}`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // 스크롤을 항상 아래로 유지
  }

  // 더미 데이터를 2초마다 하나씩 표시
  function displayDummyData() {
    let index = 0;
    const intervalId = setInterval(() => {
      if (index < dummyData.length) {
        const { user, message } = dummyData[index];
        appendMessage(user, message);
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, 2000);
  }

  // 초기 실행
  displayDummyData();