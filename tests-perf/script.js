import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  duration: "30s",
  vus: 1,
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<500"], // 95 percent of response times must be below 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

function parseJson(body) {
  try {
    return JSON.parse(body);
  } catch (error) {
    return null;
  }
}

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "health check status is 200": (r) => r.status === 200,
  });

  // Create a new bug
  const payload = JSON.stringify({
    title: `Test Bug ${Date.now()}`,
    description: "This is a test bug created by k6",
    priority: "Medium",
    status: "Open",
  });

  const headers = { "Content-Type": "application/json" };

  const createBugRes = http.post(`${BASE_URL}/api/bugs`, payload, {
    headers,
  });

  check(createBugRes, {
    "create bug status is 201": (r) => r.status === 201,
    "bug has an id": (r) => {
      const body = parseJson(r.body);
      return body !== null && body.id !== undefined;
    },
  });

  sleep(5);
}

export function handleSummary(data) {
  const checksRate = data.metrics.checks && data.metrics.checks.rate;
  const failedRate =
    data.metrics.http_req_failed && data.metrics.http_req_failed.rate;
  const durationP95 =
    data.metrics.http_req_duration &&
    data.metrics.http_req_duration.percentiles &&
    data.metrics.http_req_duration.percentiles["p(95)"];

  return {
    "perf-results.json": JSON.stringify(data, null, 2),
    stdout: [
      "Performance test summary",
      `checks rate: ${checksRate !== undefined ? checksRate : "n/a"}`,
      `http request failed rate: ${failedRate !== undefined ? failedRate : "n/a"}`,
      `http request duration p95: ${durationP95 !== undefined ? durationP95 : "n/a"}ms`,
    ].join("\n"),
  };
}
