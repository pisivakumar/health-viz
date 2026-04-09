/**
 * 10X Health Report Embed Script
 *
 * Usage in the legacy portal:
 *
 *   <div id="health-report"></div>
 *   <script src="https://your-domain.com/embed.js"
 *     data-report-id="abc123"
 *     data-container="health-report"
 *     data-height="800">
 *   </script>
 *
 * Or programmatically:
 *
 *   TenXHealth.embed({
 *     container: document.getElementById('health-report'),
 *     reportId: 'abc123',
 *     height: 800,
 *   });
 */
(function () {
  "use strict";

  var ORIGIN =
    document.currentScript &&
    document.currentScript.src
      ? new URL(document.currentScript.src).origin
      : window.location.origin;

  function createIframe(reportId, height) {
    var iframe = document.createElement("iframe");
    iframe.src = ORIGIN + "/embed/" + reportId;
    iframe.width = "100%";
    iframe.height = String(height || 800);
    iframe.frameBorder = "0";
    iframe.style.border = "none";
    iframe.style.borderRadius = "16px";
    iframe.style.overflow = "hidden";
    iframe.allow = "fullscreen";
    iframe.title = "10X Health Report";
    return iframe;
  }

  // Auto-init from script attributes
  var script = document.currentScript;
  if (script) {
    var reportId = script.getAttribute("data-report-id");
    var containerId = script.getAttribute("data-container");
    var height = parseInt(script.getAttribute("data-height") || "800", 10);

    if (reportId && containerId) {
      // Wait for DOM
      function init() {
        var container = document.getElementById(containerId);
        if (container) {
          container.appendChild(createIframe(reportId, height));
        }
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    }
  }

  // Public API
  window.TenXHealth = {
    embed: function (opts) {
      if (!opts || !opts.container || !opts.reportId) {
        console.error("[TenXHealth] Missing container or reportId");
        return;
      }
      var iframe = createIframe(opts.reportId, opts.height);
      opts.container.appendChild(iframe);
      return iframe;
    },
  };
})();
