import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import fs from "fs";
import express from "express";
import mp from "connect-multiparty";
import cors from "cors";

let final_speech_phrase = "";
let accuracyScore = 0;
let pronunciationScore = 0;
let fluencyScore = 0;

const app = express();
app.use(cors());
app.use(mp());

app.post("/analytics", async (req, res) => {
	console.log(req);
	const audio = req.files.audio.path;
	await main(audio);
	setTimeout(() => {
		console.log({ final_speech_phrase, accuracyScore, pronunciationScore, fluencyScore });
		res.send({ final_speech_phrase, accuracyScore, pronunciationScore, fluencyScore });
	}, 2000);
});

app.post("/testAnalysis", async (req, res) => {
	console.log(req);
	const text = req.body.text;
	console.log(text);
	const result = await getGptAnalysis(text);
	res.send({ result });
});

app.listen(3000, () => console.log("서버 시작"));

const main = async (audio) => {
	// provide a WAV file as an example. Replace it with your own.
	var audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audio));
	var speechConfig = sdk.SpeechConfig.fromSubscription("7bd36a0b5c434f9b9e2efb82d107a901", "koreacentral");

	var reference_text = "안녕하세요 여러분";
	// create pronunciation assessment config, set grading system, granularity and if enable miscue based on your requirement.
	const pronunciationAssessmentConfig = sdk.PronunciationAssessmentConfig.fromJSON(
		'{"GradingSystem": "HundredMark", \
        "Granularity": "Phoneme", \
        "EnableMiscue": "True", \
        "EnableProsodyAssessment": "True"}'
	);
	pronunciationAssessmentConfig.referenceText = reference_text;

	var language = "ko-KR";
	speechConfig.speechRecognitionLanguage = language;

	// create the speech recognizer.
	var reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
	pronunciationAssessmentConfig.applyTo(reco);

	const scoreNumber = {
		accuracyScore: 0,
		fluencyScore: 0,
		compScore: 0,
		prosodyScore: 0,
	};
	const allWords = [];
	var currentText = [];
	var startOffset = 0;
	var recognizedWords = [];
	var fluencyScores = [];
	var prosodyScores = [];
	var durations = [];
	var jo = {};

	// Before beginning speech recognition, setup the callbacks to be invoked when an event occurs.

	// The event recognizing signals that an intermediate recognition result is received.
	// You will receive one or more recognizing events as a speech phrase is recognized, with each containing
	// more recognized speech. The event will contain the text for the recognition since the last phrase was recognized.

	reco.recognizing = function (s, e) {
		var str = "(recognizing) Reason: " + sdk.ResultReason[e.result.reason] + " Text: " + e.result.text;
		console.log(str);
		final_speech_phrase = str;
		console.log(final_speech_phrase);
	};

	// The event recognized signals that a final recognition result is received.
	// This is the final event that a phrase has been recognized.
	// For continuous recognition, you will get one recognized event for each phrase recognized.
	reco.recognized = async function (s, e) {
		console.log("final!!!! : ", final_speech_phrase);
		console.log("pronunciation assessment for: ", e.result.text);
		var pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(e.result);
		console.log(
			" Accuracy score: ",
			pronunciation_result.accuracyScore,
			"\n",
			"pronunciation score: ",
			pronunciation_result.pronunciationScore,
			"\n",
			"completeness score : ",
			pronunciation_result.completenessScore,
			"\n",
			"fluency score: ",
			pronunciation_result.fluencyScore
		);
		accuracyScore = pronunciation_result.accuracyScore;
		pronunciationScore = pronunciation_result.pronunciationScore;
		fluencyScore = pronunciation_result.fluencyScore;
		console.log(accuracyScore, pronunciationScore, fluencyScore);
		return;
		jo = JSON.parse(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
		const nb = jo["NBest"][0];
		startOffset = nb.Words[0].Offset;
		const localtext = _.map(nb.Words, (item) => item.Word.toLowerCase());
		currentText = currentText.concat(localtext);
		fluencyScores.push(nb.PronunciationAssessment.FluencyScore);
		prosodyScores.push(nb.PronunciationAssessment.ProsodyScore);
		const isSucceeded = jo.RecognitionStatus === "Success";
		const nBestWords = jo.NBest[0].Words;
		const durationList = [];
		_.forEach(nBestWords, (word) => {
			recognizedWords.push(word);
			durationList.push(word.Duration);
		});
		durations.push(_.sum(durationList));

		if (isSucceeded && nBestWords) {
			allWords.push(...nBestWords);
		}
	};

	function calculateOverallPronunciationScore() {
		const resText = currentText.join(" ");
		let wholelyricsArry = [];
		let resTextArray = [];

		if (["zh-cn"].includes(language.toLowerCase())) {
			const resTextProcessed = (resText.toLocaleLowerCase() ?? "").replace(
				new RegExp("[^a-zA-Z0-9\u4E00-\u9FA5']+", "g"),
				" "
			);
			const wholelyrics = (reference_text.toLocaleLowerCase() ?? "").replace(
				new RegExp("[^a-zA-Z0-9\u4E00-\u9FA5']+", "g"),
				" "
			);
			const segment = new Segment();
			segment.useDefault();
			segment.loadDict("wildcard.txt");
			_.map(segment.doSegment(wholelyrics, { stripPunctuation: true }), (res) => wholelyricsArry.push(res["w"]));
			_.map(segment.doSegment(resTextProcessed, { stripPunctuation: true }), (res) =>
				resTextArray.push(res["w"])
			);
		} else {
			let resTextProcessed = (resText.toLocaleLowerCase() ?? "")
				.replace(new RegExp('[!"#$%&()*+,-./:;<=>?@[^_`{|}~]+', "g"), "")
				.replace(new RegExp("]+", "g"), "");
			let wholelyrics = (reference_text.toLocaleLowerCase() ?? "")
				.replace(new RegExp('[!"#$%&()*+,-./:;<=>?@[^_`{|}~]+', "g"), "")
				.replace(new RegExp("]+", "g"), "");
			wholelyricsArry = wholelyrics.split(" ");
			resTextArray = resTextProcessed.split(" ");
		}
		const wholelyricsArryRes = _.map(
			_.filter(wholelyricsArry, (item) => !!item),
			(item) => item.trim()
		);

		// For continuous pronunciation assessment mode, the service won't return the words with `Insertion` or `Omission`
		// We need to compare with the reference text after received all recognized words to get these error words.
		const diff = new difflib.SequenceMatcher(null, wholelyricsArryRes, resTextArray);
		const lastWords = [];
		for (const d of diff.getOpcodes()) {
			if (d[0] == "insert" || d[0] == "replace") {
				if (["zh-cn"].includes(language.toLowerCase())) {
					for (let j = d[3], count = 0; j < d[4]; count++) {
						let len = 0;
						let bfind = false;
						_.map(allWords, (item, index) => {
							if (
								(len == j ||
									(index + 1 < allWords.length &&
										allWords[index].Word.length > 1 &&
										j > len &&
										j < len + allWords[index + 1].Word.length)) &&
								!bfind
							) {
								const wordNew = _.cloneDeep(allWords[index]);
								if (
									allWords &&
									allWords.length > 0 &&
									allWords[index].PronunciationAssessment.ErrorType !== "Insertion"
								) {
									wordNew.PronunciationAssessment.ErrorType = "Insertion";
								}
								lastWords.push(wordNew);
								bfind = true;
								j += allWords[index].Word.length;
							}
							len = len + item.Word.length;
						});
					}
				} else {
					for (let j = d[3]; j < d[4]; j++) {
						if (
							allWords &&
							allWords.length > 0 &&
							allWords[j].PronunciationAssessment.ErrorType !== "Insertion"
						) {
							allWords[j].PronunciationAssessment.ErrorType = "Insertion";
						}
						lastWords.push(allWords[j]);
					}
				}
			}
			if (d[0] == "delete" || d[0] == "replace") {
				if (
					d[2] == wholelyricsArryRes.length &&
					!(jo.RecognitionStatus == "Success" || jo.RecognitionStatus == "Failed")
				)
					continue;
				for (let i = d[1]; i < d[2]; i++) {
					const word = {
						Word: wholelyricsArryRes[i],
						PronunciationAssessment: {
							ErrorType: "Omission",
						},
					};
					lastWords.push(word);
				}
			}
			if (d[0] == "equal") {
				for (let k = d[3], count = 0; k < d[4]; count++) {
					if (["zh-cn"].includes(language.toLowerCase())) {
						let len = 0;
						let bfind = false;
						_.map(allWords, (item, index) => {
							if (len >= k && !bfind) {
								if (allWords[index].PronunciationAssessment.ErrorType !== "None") {
									allWords[index].PronunciationAssessment.ErrorType = "None";
								}
								lastWords.push(allWords[index]);
								bfind = true;
								k += allWords[index].Word.length;
							}
							len = len + item.Word.length;
						});
					} else {
						lastWords.push(allWords[k]);
						k++;
					}
				}
			}
		}

		let reference_words = [];
		if (["zh-cn"].includes(language.toLowerCase())) {
			reference_words = allWords;
		} else {
			reference_words = wholelyricsArryRes;
		}

		let recognizedWordsRes = [];
		_.forEach(recognizedWords, (word) => {
			if (word.PronunciationAssessment.ErrorType == "None") {
				recognizedWordsRes.push(word);
			}
		});

		let compScore = Number(((recognizedWordsRes.length / reference_words.length) * 100).toFixed(0));
		if (compScore > 100) {
			compScore = 100;
		}
		scoreNumber.compScore = compScore;

		const accuracyScores = [];
		_.forEach(lastWords, (word) => {
			if (word && word?.PronunciationAssessment?.ErrorType != "Insertion") {
				accuracyScores.push(Number(word?.PronunciationAssessment.AccuracyScore ?? 0));
			}
		});
		scoreNumber.accuracyScore = Number((_.sum(accuracyScores) / accuracyScores.length).toFixed(0));

		if (startOffset) {
			const sumRes = [];
			_.forEach(fluencyScores, (x, index) => {
				sumRes.push(x * durations[index]);
			});
			scoreNumber.fluencyScore = _.sum(sumRes) / _.sum(durations);
		}
		scoreNumber.prosodyScore = Number((_.sum(prosodyScores) / prosodyScores.length).toFixed(0));

		const sortScore = Object.keys(scoreNumber).sort(function (a, b) {
			return scoreNumber[a] - scoreNumber[b];
		});
		if (jo.RecognitionStatus == "Success" || jo.RecognitionStatus == "Failed") {
			scoreNumber.pronScore = Number(
				scoreNumber[sortScore["0"]] * 0.4 +
					scoreNumber[sortScore["1"]] * 0.2 +
					scoreNumber[sortScore["2"]] * 0.2 +
					scoreNumber[sortScore["3"]] * 0.2
			).toFixed(0);
		} else {
			scoreNumber.pronScore = Number(
				(scoreNumber.accuracyScore * 0.5 + scoreNumber.fluencyScore * 0.5).toFixed(0)
			);
		}

		console.log(
			"    Paragraph pronunciation score: ",
			scoreNumber.pronScore,
			", accuracy score: ",
			scoreNumber.accuracyScore,
			", completeness score: ",
			scoreNumber.compScore,
			", fluency score: ",
			scoreNumber.fluencyScore,
			", prosody score: ",
			scoreNumber.prosodyScore
		);

		_.forEach(lastWords, (word, ind) => {
			console.log(
				"    ",
				ind + 1,
				": word: ",
				word.Word,
				"\taccuracy score: ",
				word.PronunciationAssessment.AccuracyScore,
				"\terror type: ",
				word.PronunciationAssessment.ErrorType,
				";"
			);
		});
	}

	// The event signals that the service has stopped processing speech.
	// https://docs.microsoft.com/javascript/api/microsoft-cognitiveservices-speech-sdk/speechrecognitioncanceledeventargs?view=azure-node-latest
	// This can happen for two broad classes of reasons.
	// 1. An error is encountered.
	//    In this case the .errorDetails property will contain a textual representation of the error.
	// 2. Speech was detected to have ended.
	//    This can be caused by the end of the specified file being reached, or ~20 seconds of silence from a microphone input.
	reco.canceled = function (s, e) {
		if (e.reason === sdk.CancellationReason.Error) {
			var str = "(cancel) Reason: " + sdk.CancellationReason[e.reason] + ": " + e.errorDetails;
			console.log(str);
		}
		reco.stopContinuousRecognitionAsync();
	};

	// Signals that a new session has started with the speech service
	reco.sessionStarted = function (s, e) {};

	// Signals the end of a session with the speech service.
	reco.sessionStopped = function (s, e) {
		reco.stopContinuousRecognitionAsync();
		reco.close();
		calculateOverallPronunciationScore();
	};

	reco.startContinuousRecognitionAsync();
};

import axios from "axios";

let getGptAnalysis = async (input) => {
	let result = "";
	await axios
		.post(
			"https://chat.openai.com/backend-api/conversation",
			{
				action: "next",
				messages: [
					{
						id: "89e46f2c-163e-40bd-a26c-e68aafd1f69f",
						role: "user",
						content: {
							content_type: "text",
							parts: [`${input} \n 위와 같은 발표 내용에 대해 발음이나 억양 평가는 빼고 내용만 평가해줘`],
						},
					},
				],
				model: "text-davinci-002-render-sha",
				parent_message_id: "9d01cde8-8ad4-41ea-a82d-ed1498ab2f4b",
				arkose_token:
					"368179642ac3451e2.8652670904|r=ap-southeast-1|meta=3|metabgclr=transparent|metaiconclr=%23757575|guitextcolor=%23000000|pk=35536E1E-65B4-4D96-9D97-6ADB7EFF8147|at=40|sup=1|rid=31|ag=101|cdn_url=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-ap-southeast-1.arkoselabs.com|surl=https%3A%2F%2Ftcr9i.chat.openai.com|smurl=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager",
			},
			{
				headers: {
					Accept: "*/*",
					Accept_Encoding: "gzip, deflate, br",
					Connection: "keep-alive",
					content_type: "application/json",
					keepAlive: true,
					Authorization:
						"Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiIxMDAwY2h3QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7InBvaWQiOiJvcmctV0JIMEtrc2xxYzB4NWlQTVFzeUlDNThsIiwidXNlcl9pZCI6InVzZXItTm1PMXZCTDYySUZqeTAxWDVjYklyV0owIn0sImlzcyI6Imh0dHBzOi8vYXV0aDAub3BlbmFpLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMjM0OTcyNTI5NzkyODM0Njc1MSIsImF1ZCI6WyJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxIiwiaHR0cHM6Ly9vcGVuYWkub3BlbmFpLmF1dGgwYXBwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2OTk2MzI1NzgsImV4cCI6MTcwMDQ5NjU3OCwiYXpwIjoiVGRKSWNiZTE2V29USHROOTVueXl3aDVFNHlPbzZJdEciLCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIG1vZGVsLnJlYWQgbW9kZWwucmVxdWVzdCBvcmdhbml6YXRpb24ucmVhZCBvcmdhbml6YXRpb24ud3JpdGUgb2ZmbGluZV9hY2Nlc3MifQ.vVxbEXBI1am4_t1L2l9YRojZ-k6444aRatYlRnVb02UxkbIFNGmATz8jpE_AhdlOgKlKO9Cu8tf1-J3lbbOh0UPN_UuXjMf9pll3a2CAKHYatC0bx_mwx2iBI0vng9dThwwht1oq5k94tnM--meiF6F9YAKEEexhuTpNlL9CoyQV95aHU-yIDmg_X2wiXcJJjWG_U0i2Zvyr_2J8gUpAmHobynU1QIwEdRrh7axQvJh2vP1G1g86sKJQ408cuwpEEA-DDYb6BfNyobL0bL0iJ5ztAzpUCrkZlrZYXMFQuFkusi0HI7Gv0V0lObQq3TO4mnk_Oej2SVgW4VVN3VVtMQ",
				},
			}
		)
		.then((response) => {
			let res = response.data.split("\n");
			let ind = res.length - 7;
			console.log(JSON.parse(res[ind].slice(6)).message.content.parts);
			result = JSON.parse(res[ind].slice(6)).message.content.parts;
		});
	return result;
};
