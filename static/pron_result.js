const server2URL = "";
// 서버로부터 데이터 가져오기
fetch(serverURL)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    // 데이터를 받아와서 웹 페이지에 표시
    const dataContainer = document.getElementById("pron_result");
    dataContainer.innerHTML = `<p>서버로부터 받은 데이터: ${JSON.stringify(
      data
    )}</p>`;
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
