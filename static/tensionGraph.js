const frameTensions = [20, 30, 40, 50, 60, 70, 80, 90, 100, 80, 70, 60, 50]; //임의로
const canvas = document.getElementById("tensionGraph");
const context = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = Math.min(centerX, centerY) - 10;

// 발표 중 긴장한 정도를 퍼센티지로 계산&임의로
const totalFrames = frameTensions.length;
const tensePercentage =
  frameTensions.reduce((sum, tension) => sum + tension, 0) / totalFrames;
const server3URL = "";

// 서버로부터 데이터 가져오기
/*
fetch(serverURL)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    // 데이터를 받아와서 웹 페이지에 표시
    tensePercentage = data; //json 값 받아오기
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
*/

// 그래프 그리는 함수
function drawGraph() {
  // 원 그래프 그리기
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  context.fillStyle = "#f0f0f0"; // 배경색
  context.fill();

  // 긴장한 정도를 표시할 부분 그리기
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.arc(
    centerX,
    centerY,
    radius,
    0, // 수정: 시작 각도를 0으로 변경
    (tensePercentage / 100) * 2 * Math.PI
  );
  context.fillStyle = "#8a2be2"; // 긴장한 정도 색상
  context.fill();

  // 중앙에 텍스트 표시
  context.fillStyle = "#333";
  context.font = "20px Arial";
  context.fillText(
    `${tensePercentage.toFixed(2)}%`,
    centerX - 30,
    centerY + 10
  );
}

// 초기 그래프 그리기
drawGraph();
