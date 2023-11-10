let rec = null;
let audioStream = null;
const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");
console.log(recordButton);
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", transcribeText);
let cnt = 1;
let accuracyScore = "";
let final_speech_phrase = "";
let fluencyScore = "";
let pronunciationScore = "";

function startRecording() {
	let constraints = { audio: true, video: false };
	recordButton.disabled = true;
	stopButton.disabled = false;
	navigator.mediaDevices
		.getUserMedia(constraints)
		.then(function (stream) {
			const audioContext = new window.AudioContext();
			audioStream = stream;
			const input = audioContext.createMediaStreamSource(stream);
			rec = new Recorder(input, { numChannels: 1 });
			rec.record();
		})
		.catch(function (err) {
			recordButton.disabled = false;
			stopButton.disabled = true;
		});
}
function transcribeText() {
	stopButton.disabled = true;
	recordButton.disabled = false;
	rec.stop();
	audioStream.getAudioTracks()[0].stop();
	rec.exportWAV(uploadSoundData);
}

function uploadSoundData(blob) {
	let send_data = new FormData();
	send_data.append("audio", blob);
	console.log(send_data);
	fetch("http://localhost:3000/analytics", {
		method: "POST",
		headers: {},
		body: send_data,
	})
		.then((response) => response.json())
		.then((result) => {
			console.log(result);
			accuracyScore = result.accuracyScore;
			final_speech_phrase = result.final_speech_phrase;
			fluencyScore = result.fluencyScore;
			pronunciationScore = result.pronunciationScore;
		})
		.then(() => {
			const text = final_speech_phrase.slice(46);
			let send_text = new FormData();
			send_text.append("text", text);
			fetch("http://localhost:3000/testAnalysis", {
				method: "POST",
				headers: {},
				body: send_text,
			})
				.then((response) => response.json())
				.then((result) => {
					console.log(result);
				});
		});
}
