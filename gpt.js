import axios from "axios";

let getGptAnalysis = (input) => {
	axios
		.post(
			"https://chat.openai.com/backend-api/conversation",
			{
				//data: {
				action: "next",
				messages: [
					{
						id: "89e46f2c-163e-40bd-a26c-e68aafd1f69f",
						role: "user",
						content: {
							content_type: "text",
							parts: [`${input} 위 발표 내용에 대해 평가해줘`],
						},
					},
				],
				model: "text-davinci-002-render-sha",
				parent_message_id: "9d01cde8-8ad4-41ea-a82d-ed1498ab2f4b",
				arkose_token:
					"368179642ac3451e2.8652670904|r=ap-southeast-1|meta=3|metabgclr=transparent|metaiconclr=%23757575|guitextcolor=%23000000|pk=35536E1E-65B4-4D96-9D97-6ADB7EFF8147|at=40|sup=1|rid=31|ag=101|cdn_url=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-ap-southeast-1.arkoselabs.com|surl=https%3A%2F%2Ftcr9i.chat.openai.com|smurl=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager",
			},
			//},
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
		});
};
getGptAnalysis("이건 혁신적인 발표야.");
