import { Octokit } from "@octokit/rest";

// Initialize Octokit without authentication for public data
const octokit = new Octokit();

async function getReactIssues() {
  try {
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: "edwrdq",
      repo: "dotlib",
      per_page: 1000000    // And control pagination
    });

    issues.forEach(issue => {
      console.log(issue);
      /*
        * we care about:
        * - issue number
        * - body
        * - title
        * - state
      */
    });

  } catch (error) {
    console.error("Error fetching issues:", error);
  }
}

getReactIssues();
