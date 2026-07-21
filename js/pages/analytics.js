window.PD = window.PD || {};
window.PD.Pages = window.PD.Pages || {};

window.PD.Pages.Analytics = (function () {
  function render(container) {
    container.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.className = "page analytics-page";

    var service = window.PD.Services.Analytics;
    if (!service) {
      wrap.innerHTML = `<div class="empty-state">Analytics service not loaded.</div>`;
      container.appendChild(wrap);
      return;
    }

    var overview = service.getOverviewMetrics();
    var subjects = service.getSubjectAnalytics();
    var charts = service.getChartData();
    var heatmaps = service.getHeatmapsData();
    var forecasting = service.getForecasting();
    var insights = service.getDynamicInsights();

    // 1. Header
    wrap.appendChild(buildHeader());

    // 2. Overview Metrics Cards Grid
    wrap.appendChild(buildOverviewGrid(overview));

    // 3. Dynamic Insights Engine Panel
    wrap.appendChild(buildInsightsPanel(insights));

    // 4. Subject Analytics
    wrap.appendChild(buildSubjectSection(subjects));

    // 5. Interactive Native SVG Charts Grid
    wrap.appendChild(buildChartsGrid(charts));

    // 6. Interactive Heatmaps
    wrap.appendChild(buildHeatmapsSection(heatmaps));

    // 7. Forecasting Engine Panel
    wrap.appendChild(buildForecastingPanel(forecasting));

    container.appendChild(wrap);
  }

  function buildHeader() {
    var header = document.createElement("div");
    header.className = "analytics-header";

    header.innerHTML = `
      <div class="analytics-title-group">
        <h1><span>📊</span> <span>Analytics & Performance Intelligence</span></h1>
        <p class="analytics-sub">Data-driven performance metrics, interactive trends, heatmaps & JEE forecasting engine</p>
      </div>
      <div>
        <button class="btn btn-secondary export-report-btn" type="button">📥 Export Analytics Report</button>
      </div>
    `;

    header.querySelector(".export-report-btn").addEventListener("click", function () {
      var dataStr = window.PD.Store.exportAllData();
      var blob = new Blob([dataStr], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "project-december-analytics-report.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    return header;
  }

  function buildOverviewGrid(overview) {
    var grid = document.createElement("div");
    grid.className = "analytics-metrics-grid";

    var cards = [
      { label: "Study Hours", val: overview.totalStudyHours + "h", icon: "⏱", sub: "Logged & computed" },
      { label: "Tasks Done", val: overview.totalCompletedTasks, icon: "✅", sub: "Resource items completed" },
      { label: "Total Revisions", val: overview.totalRevisions, icon: "🔄", sub: "Revision cycles logged" },
      { label: "Chapters Done", val: overview.chaptersCompleted + " / " + overview.totalChapters, icon: "📚", sub: Math.round((overview.chaptersCompleted / overview.totalChapters) * 100) + "% Syllabus completed" },
      { label: "Current Streak", val: "🔥 " + overview.currentStreak + " Days", icon: "⚡", sub: "Active daily streak" },
      { label: "Longest Streak", val: "🏆 " + overview.longestStreak + " Days", icon: "🥇", sub: "All-time record" },
      { label: "Avg Daily Time", val: overview.avgDailyStudyHours + "h / day", icon: "📈", sub: "Daily study pace" }
    ];

    cards.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "metric-card";
      el.innerHTML = `
        <div class="metric-card-header">
          <span>${c.label}</span>
          <span class="metric-card-icon">${c.icon}</span>
        </div>
        <div class="metric-card-value">${c.val}</div>
        <div class="metric-card-sub">${c.sub}</div>
      `;
      grid.appendChild(el);
    });

    return grid;
  }

  function buildInsightsPanel(insights) {
    var panel = document.createElement("div");
    panel.className = "insights-panel";

    var header = document.createElement("div");
    header.className = "insights-panel-header";
    header.innerHTML = `
      <span style="font-size: 20px;">🧠</span>
      <h2 class="insights-panel-title">Dynamic Insights & Diagnostic Engine</h2>
    `;

    var grid = document.createElement("div");
    grid.className = "insights-grid";

    grid.innerHTML = `
      <div class="insight-card">
        <div class="insight-label">🌟 Strongest Subject</div>
        <div class="insight-value" style="color:#10b981;">${insights.strongestSubject}</div>
      </div>
      <div class="insight-card">
        <div class="insight-label">⚠️ Weakest Subject</div>
        <div class="insight-value" style="color:#ef4444;">${insights.weakestSubject}</div>
      </div>
      <div class="insight-card">
        <div class="insight-label">🔥 Consistency Status</div>
        <div class="insight-value">${insights.studyConsistency}</div>
      </div>
      <div class="insight-card">
        <div class="insight-label">📌 Urgent Revisions Needed</div>
        <ul class="insight-list">
          ${insights.urgentRevisions.map(function (item) { return "<li>" + item + "</li>"; }).join("")}
        </ul>
      </div>
      <div class="insight-card" style="grid-column: span 2;">
        <div class="insight-label">🎯 Recommended Focus for Tomorrow</div>
        <ul class="insight-list">
          ${insights.recommendedFocusTomorrow.map(function (item) { return "<li>" + item + "</li>"; }).join("")}
        </ul>
      </div>
    `;

    panel.appendChild(header);
    panel.appendChild(grid);
    return panel;
  }

  function buildSubjectSection(subjects) {
    var sec = document.createElement("div");
    sec.innerHTML = `<h2 class="section-title"><span>📐</span> <span>Subject Performance Matrix</span></h2>`;

    var grid = document.createElement("div");
    grid.className = "subject-analytics-grid";

    ["Physics", "Chemistry", "Mathematics"].forEach(function (sub) {
      var s = subjects[sub];
      if (!s) return;

      var card = document.createElement("div");
      card.className = "subject-card";

      var pct = Math.round((s.completedChapters / s.totalChapters) * 100);

      card.innerHTML = `
        <div class="subject-card-header">
          <span class="subject-card-title">${sub}</span>
          <span class="badge" style="background:var(--bg-tertiary); font-weight:700;">${pct}% Complete</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="subject-card-row">
          <span>Completed Chapters:</span>
          <strong>${s.completedChapters} / ${s.totalChapters}</strong>
        </div>
        <div class="subject-card-row">
          <span>Avg Confidence:</span>
          <strong>${s.avgConfidence} / 5 ⭐</strong>
        </div>
        <div class="subject-card-row">
          <span>Avg Health Score:</span>
          <strong>${s.avgHealth} / 100</strong>
        </div>
        <div class="subject-card-row">
          <span>Study Hours Logged:</span>
          <strong>${s.studyHours} hrs</strong>
        </div>
        <div class="subject-card-row">
          <span>Revisions Count:</span>
          <strong>${s.revisionCount} cycles</strong>
        </div>
      `;

      grid.appendChild(card);
    });

    sec.appendChild(grid);
    return sec;
  }

  function buildChartsGrid(charts) {
    var sec = document.createElement("div");
    sec.innerHTML = `<h2 class="section-title"><span>📈</span> <span>Interactive Analytics Charts</span></h2>`;

    var grid = document.createElement("div");
    grid.className = "charts-grid";

    // Chart 1: 30-Day Daily Study Time Line Graph
    grid.appendChild(createLineChartCard("Daily Study Time (30 Days)", charts.dailyStudyTime));

    // Chart 2: Weekly Study Hours Bar Chart
    grid.appendChild(createBarChartCard("Weekly Study Hours (8 Weeks)", charts.weeklyStudyHours, "weekLabel", "hours", "#3b82f6"));

    // Chart 3: Subject Hours Distribution Donut Chart
    grid.appendChild(createDonutChartCard("Subject Hours Distribution", charts.subjectDistribution));

    // Chart 4: Confidence Distribution
    grid.appendChild(createHistogramCard("Confidence Level Distribution", charts.confidenceDistribution, "label", "count", "#8b5cf6"));

    // Chart 5: Health Distribution
    grid.appendChild(createHealthDistributionCard("Health Band Distribution", charts.healthDistribution));

    // Chart 6: Revision Frequency
    grid.appendChild(createBarChartCard("Revision Cycles Frequency", charts.revisionFrequency, "range", "count", "#10b981"));

    sec.appendChild(grid);
    return sec;
  }

  /* NATIVE SVG CHART RENDERERS */

  function createLineChartCard(title, data) {
    var card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `<div class="chart-card-title"><span>${title}</span> <span style="font-size:12px; color:var(--text-tertiary);">Hours/day</span></div>`;

    var container = document.createElement("div");
    container.className = "chart-svg-container";

    var maxVal = Math.max.apply(Math, data.map(function (d) { return d.hours; }).concat([6]));
    var width = 360;
    var height = 200;
    var padding = 30;

    var points = data.map(function (d, i) {
      var x = padding + (i / (data.length - 1)) * (width - padding * 2);
      var y = height - padding - (d.hours / maxVal) * (height - padding * 2);
      return { x: x, y: y, hours: d.hours, label: d.label };
    });

    var pathD = "M " + points.map(function (p) { return p.x + "," + p.y; }).join(" L ");
    var areaD = pathD + " L " + points[points.length - 1].x + "," + (height - padding) + " L " + points[0].x + "," + (height - padding) + " Z";

    var svgHtml = `
      <svg class="svg-chart" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-axis-line"/>
        <path d="${areaD}" class="chart-area"/>
        <path d="${pathD}" class="chart-line"/>
        ${points.map(function (p) {
          return `<circle cx="${p.x}" cy="${p.y}" r="4" class="chart-point"><title>${p.label}: ${p.hours} hrs</title></circle>`;
        }).join("")}
      </svg>
    `;

    container.innerHTML = svgHtml;
    card.appendChild(container);
    return card;
  }

  function createBarChartCard(title, data, xKey, yKey, color) {
    var card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `<div class="chart-card-title"><span>${title}</span></div>`;

    var container = document.createElement("div");
    container.className = "chart-svg-container";

    var maxVal = Math.max.apply(Math, data.map(function (d) { return d[yKey]; }).concat([5]));
    var width = 360;
    var height = 200;
    var padding = 35;

    var barWidth = ((width - padding * 2) / data.length) * 0.6;
    var gap = (width - padding * 2) / data.length;

    var barsHtml = data.map(function (d, i) {
      var val = d[yKey];
      var barH = (val / maxVal) * (height - padding * 2);
      var x = padding + i * gap + gap * 0.2;
      var y = height - padding - barH;

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${color}" class="chart-bar">
          <title>${d[xKey]}: ${val}</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${height - padding + 15}" text-anchor="middle" class="chart-label">${d[xKey]}</text>
      `;
    }).join("");

    container.innerHTML = `
      <svg class="svg-chart" viewBox="0 0 ${width} ${height}">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-axis-line"/>
        ${barsHtml}
      </svg>
    `;

    card.appendChild(container);
    return card;
  }

  function createHistogramCard(title, data, xKey, yKey, color) {
    return createBarChartCard(title, data, xKey, yKey, color);
  }

  function createDonutChartCard(title, data) {
    var card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `<div class="chart-card-title"><span>${title}</span></div>`;

    var container = document.createElement("div");
    container.className = "chart-svg-container";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "space-around";

    var total = data.reduce(function (sum, d) { return sum + d.hours; }, 0) || 1;
    var cumulativePercent = 0;

    function getCoordinatesForPercent(percent) {
      var x = Math.cos(2 * Math.PI * percent);
      var y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    }

    var slices = data.map(function (d) {
      var percent = d.hours / total;
      var startPercent = cumulativePercent;
      cumulativePercent += percent;

      var start = getCoordinatesForPercent(startPercent);
      var end = getCoordinatesForPercent(cumulativePercent);
      var largeArcFlag = percent > 0.5 ? 1 : 0;

      var pathData = [
        `M ${start[0]} ${start[1]}`,
        `A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`,
        `L 0 0`
      ].join(" ");

      return `<path d="${pathData}" fill="${d.color}"><title>${d.subject}: ${d.hours}h (${Math.round(percent * 100)}%)</title></path>`;
    }).join("");

    var legendHtml = `
      <div style="display:flex; flex-direction:column; gap:8px; font-size:12px;">
        ${data.map(function (d) {
          var pct = Math.round((d.hours / total) * 100);
          return `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="width:12px; height:12px; border-radius:3px; background:${d.color};"></span>
              <span style="color:var(--text-primary); font-weight:600;">${d.subject}</span>
              <span style="color:var(--text-tertiary);">${d.hours}h (${pct}%)</span>
            </div>
          `;
        }).join("")}
      </div>
    `;

    container.innerHTML = `
      <svg viewBox="-1.2 -1.2 2.4 2.4" style="width:140px; height:140px; transform: rotate(-90deg);">
        ${slices}
        <circle cx="0" cy="0" r="0.6" fill="var(--bg-secondary)"/>
      </svg>
      ${legendHtml}
    `;

    card.appendChild(container);
    return card;
  }

  function createHealthDistributionCard(title, data) {
    var card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `<div class="chart-card-title"><span>${title}</span></div>`;

    var container = document.createElement("div");
    container.className = "chart-svg-container";

    var maxVal = Math.max.apply(Math, data.map(function (d) { return d.count; }).concat([10]));
    var width = 360;
    var height = 200;
    var padding = 35;

    var barWidth = ((width - padding * 2) / data.length) * 0.65;
    var gap = (width - padding * 2) / data.length;

    var barsHtml = data.map(function (d, i) {
      var val = d.count;
      var barH = (val / maxVal) * (height - padding * 2);
      var x = padding + i * gap + gap * 0.15;
      var y = height - padding - barH;

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${d.color}" class="chart-bar">
          <title>${d.label}: ${val} chapters</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${height - padding + 15}" text-anchor="middle" class="chart-label">${d.band.toUpperCase()}</text>
      `;
    }).join("");

    container.innerHTML = `
      <svg class="svg-chart" viewBox="0 0 ${width} ${height}">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-axis-line"/>
        ${barsHtml}
      </svg>
    `;

    card.appendChild(container);
    return card;
  }

  function buildHeatmapsSection(heatmaps) {
    var sec = document.createElement("div");
    sec.innerHTML = `<h2 class="section-title"><span>🔥</span> <span>Interactive Diagnostic Heatmaps</span></h2>`;

    var grid = document.createElement("div");
    grid.className = "heatmaps-grid";

    // 1. Weak Chapters Heatmap
    var weakCard = document.createElement("div");
    weakCard.className = "heatmap-card";
    weakCard.innerHTML = `<h3 style="font-size:14px; font-weight:700; color:var(--text-primary);">⚠️ Critically Weak Chapters (< 50 Health)</h3>`;
    var weakChips = document.createElement("div");
    weakChips.className = "heatmap-chips";

    if (heatmaps.weakChapters.length === 0) {
      weakChips.innerHTML = `<span style="font-size:12px; color:var(--text-tertiary);">No weak chapters! Great job.</span>`;
    } else {
      heatmaps.weakChapters.forEach(function (c) {
        var chip = document.createElement("button");
        chip.className = "heatmap-chip chip-danger";
        chip.type = "button";
        chip.innerHTML = `<span>${c.title}</span> <span style="font-weight:800;">${c.health}</span>`;
        chip.addEventListener("click", function () {
          window.PD.Router.focusChapter(c.id);
        });
        weakChips.appendChild(chip);
      });
    }
    weakCard.appendChild(weakChips);
    grid.appendChild(weakCard);

    // 2. Overdue Revisions Heatmap
    var revCard = document.createElement("div");
    revCard.className = "heatmap-card";
    revCard.innerHTML = `<h3 style="font-size:14px; font-weight:700; color:var(--text-primary);">⏰ Overdue Revisions</h3>`;
    var revChips = document.createElement("div");
    revChips.className = "heatmap-chips";

    if (heatmaps.overdueRevisions.length === 0) {
      revChips.innerHTML = `<span style="font-size:12px; color:var(--text-tertiary);">All revisions are on track!</span>`;
    } else {
      heatmaps.overdueRevisions.forEach(function (c) {
        var chip = document.createElement("button");
        chip.className = "heatmap-chip chip-warning";
        chip.type = "button";
        chip.innerHTML = `<span>${c.title}</span> <span>${c.label}</span>`;
        chip.addEventListener("click", function () {
          window.PD.Router.focusChapter(c.id);
        });
        revChips.appendChild(chip);
      });
    }
    revCard.appendChild(revChips);
    grid.appendChild(revCard);

    // 3. Least Studied Topics
    var leastCard = document.createElement("div");
    leastCard.className = "heatmap-card";
    leastCard.innerHTML = `<h3 style="font-size:14px; font-weight:700; color:var(--text-primary);">❄️ Least Studied Topics</h3>`;
    var leastChips = document.createElement("div");
    leastChips.className = "heatmap-chips";

    heatmaps.leastStudied.slice(0, 8).forEach(function (c) {
      var chip = document.createElement("button");
      chip.className = "heatmap-chip chip-neutral";
      chip.type = "button";
      chip.innerHTML = `<span>${c.title}</span> <span style="font-size:10px; opacity:0.8;">${c.subject}</span>`;
      chip.addEventListener("click", function () {
        window.PD.Router.focusChapter(c.id);
      });
      leastChips.appendChild(chip);
    });
    leastCard.appendChild(leastChips);
    grid.appendChild(leastCard);

    sec.appendChild(grid);
    return sec;
  }

  function buildForecastingPanel(f) {
    var card = document.createElement("div");
    card.className = "forecasting-card";

    var isGood = f.isBeforeExam;
    var badgeClass = isGood ? "badge-success" : "badge-warning";

    card.innerHTML = `
      <div class="forecasting-header">
        <div>
          <h2 style="font-size:18px; font-weight:800; color:var(--text-primary);">🔮 JEE Target & Completion Forecasting Engine</h2>
          <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Dynamic estimation based on historical chapter completion velocity</p>
        </div>
        <div class="forecasting-badge ${badgeClass}">${f.confidenceIndicator}</div>
      </div>
      <div class="forecasting-grid">
        <div class="forecast-item">
          <span class="forecast-item-label">Target JEE Exam Date</span>
          <span class="forecast-item-val">${f.targetExamDate}</span>
          <span style="font-size:11px; color:var(--text-tertiary);">${f.daysRemainingToExam} days remaining</span>
        </div>
        <div class="forecast-item">
          <span class="forecast-item-label">Projected Syllabus Finish</span>
          <span class="forecast-item-val" style="color: ${isGood ? '#10b981' : '#f59e0b'};">${f.expectedCompletionDate}</span>
          <span style="font-size:11px; color:var(--text-tertiary);">${isGood ? f.daysBuffer + " days buffer before exam" : "Behind schedule by " + Math.abs(f.daysBuffer) + " days"}</span>
        </div>
        <div class="forecast-item">
          <span class="forecast-item-label">Current Velocity</span>
          <span class="forecast-item-val">${f.velocityChaptersPerWeek} ch / week</span>
          <span style="font-size:11px; color:var(--text-tertiary);">${f.remainingChapters} chapters remaining</span>
        </div>
        <div class="forecast-item">
          <span class="forecast-item-label">Required Weekly Study</span>
          <span class="forecast-item-val">${f.weeklyWorkloadRequired} hrs / week</span>
          <span style="font-size:11px; color:var(--text-tertiary);">Goal target: ${f.futureStudyCapacityHoursPerWeek} hrs / week</span>
        </div>
      </div>
    `;

    return card;
  }

  return { render: render };
})();
