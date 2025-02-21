const fs = require("fs");
const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "juice-shop";
const REPO_NAME = "juice-shop";
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`;
const LABEL = "spam";

async function fetchSpamPRs() {
  try {
    const response = await axios.get(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: {
        labels: LABEL,
        state: "closed",
        per_page: 100,
      },
    });

    const spamPRs = response.data;
    const totalSpamPRs = spamPRs.length;
    
    // Save spam PRs to a file
    fs.writeFileSync("spam-prs.json", JSON.stringify(spamPRs, null, 2));

    console.log(`✅ Found ${totalSpamPRs} spam PRs.`);
    
    return totalSpamPRs;
  } catch (error) {
    console.error("❌ Error fetching spam PRs:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function createGitHubIssue(totalSpamPRs) {
  try {
    const reportTitle = `📊 Monthly Spam PR Report - ${new Date().toLocaleString("default", { month: "long", year: "numeric" })}`;
    const reportBody = `### 📢 Monthly Spam PR Report\n\nTotal spam PRs closed this month: **${totalSpamPRs}**\n\n[View full details](https://github.com/${REPO_OWNER}/${REPO_NAME}/issues?q=label%3Aspam+state%3Aclosed)`;

    const response = await axios.post(GITHUB_API_URL, {
      title: reportTitle,
      body: reportBody,
      labels: ["report"],
    }, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    console.log(`✅ Report issue created: ${response.data.html_url}`);
  } catch (error) {
    console.error("❌ Error creating GitHub issue:", error.response?.data || error.message);
    process.exit(1);
  }
}

(async () => {
  const totalSpamPRs = await fetchSpamPRs();
  await createGitHubIssue(totalSpamPRs);
})();
