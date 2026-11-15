"""Record a bounded unauthenticated HTTP observation; no response bodies or secrets retained."""
import datetime
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

TARGETS = ["https://v0.app/ebb10", "https://vercel.com/ebb10", "https://github.com/codespaces"]
entries = []
current = None

def stamp(request):
    request.started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    request.clock = time.monotonic()
    return request

def record(request, status, headers, data=b"", redirect=""):
    elapsed = round((time.monotonic() - request.clock) * 1000)
    entries.append({
        "startedDateTime": request.started, "time": elapsed,
        "request": {"method": "GET", "url": request.full_url, "httpVersion": "", "headers": [], "queryString": [], "cookies": [], "headersSize": -1, "bodySize": 0},
        "response": {"status": status, "statusText": "", "httpVersion": "", "headers": [{"name": k, "value": headers[k]} for k in ["Content-Type", "Cache-Control"] if headers.get(k)], "cookies": [], "content": {"size": len(data), "mimeType": headers.get("Content-Type", "application/octet-stream")}, "redirectURL": redirect, "headersSize": -1, "bodySize": -1},
        "cache": {}, "timings": {"send": -1, "wait": -1, "receive": -1},
        "_limitations": ["No browser scripts executed.", "Bodies, cookies and authentication headers omitted.", "HTTP version, transferred body size and timing breakdown not observed.", "time measures end-to-end urllib processing, not a browser performance benchmark.", "At most 2 MB read per final response; content.size is bytes read, not a complete transfer guarantee."],
    })

class Recorder(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        global current
        record(req, code, headers, redirect=newurl)
        current = stamp(super().redirect_request(req, fp, code, msg, headers, newurl))
        return current

opener = urllib.request.build_opener(Recorder())
for url in TARGETS:
    current = stamp(urllib.request.Request(url, headers={"User-Agent": "ForgeStudioResearch/0.2 public-observation"}))
    try:
        with opener.open(current, timeout=25) as response:
            record(current, response.status, response.headers, response.read(2_000_000))
    except urllib.error.HTTPError as error:
        record(current, error.code, error.headers)
    except Exception as error:
        print(f"Observation failed for {url}: {type(error).__name__}", file=sys.stderr)
        raise
output = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "work/public-targets.har")
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({"log": {"version": "1.2", "creator": {"name": "Forge public HTTP recorder", "version": "0.2"}, "entries": entries}}, indent=2))
print(json.dumps({"file": str(output), "records": len(entries), "responses": [{"url": e["request"]["url"], "status": e["response"]["status"]} for e in entries]}, indent=2))
