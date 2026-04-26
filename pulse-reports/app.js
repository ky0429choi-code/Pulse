/**
 * Pulse Reports - Core Analytics Engine
 * Offline Pure Local Mode (No External APIs)
 */

document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('rawInput');
    const processBtn = document.getElementById('processBtn');
    const copyBtn = document.getElementById('copyBtn');
    
    // 🎨 UI Update Functions
    const setStat = (id, val) => document.getElementById(id).textContent = val;

    // 🛠️ Core Analytics Logic
    processBtn.onclick = () => {
        const raw = inputArea.value.trim();
        if (!raw) return alert("분석할 데이터를 입력하거나 파일을 업로드하세요.");

        // 1단계: 파싱 및 평탄화 (Flattening)
        // 1열: 기본ID, 2~9열: 속성 데이터
        const rows = raw.split('\n').map(line => line.split(/[\t,]/).map(s => s.trim()));
        
        const processedData = rows.map(cols => {
            const taskId = cols[0]; // 1열
            // 2열~9열을 평탄화 (속성 매핑)
            return {
                id: taskId,
                date: cols[1] || 'Unknown',
                category: cols[2] || '기타',
                hours: parseFloat(cols[3]) || 0,
                status: cols[4] || '완료',
                manager: cols[5] || '미지정',
                attr1: cols[6],
                attr2: cols[7]
            };
        });

        runAnalytics(processedData);
    };

    function runAnalytics(data) {
        // 집계 로직
        const totalTasks = data.length;
        const totalHours = data.reduce((acc, cur) => acc + cur.hours, 0);
        const categories = {};
        const monthlyWorkload = Array(12).fill(0);

        data.forEach(item => {
            // 카테고리 집계
            categories[item.category] = (categories[item.category] || 0) + 1;
            
            // 월별 집계 (날짜 파싱)
            const monthMatches = item.date.match(/(\d+)\uc6d4|(\d{4})-(\d{2})/);
            if (monthMatches) {
                const m = parseInt(monthMatches[1] || monthMatches[3]);
                if (m >= 1 && m <= 12) monthlyWorkload[m - 1] += item.hours;
            }
        });

        // 요약 업데이트
        setStat('stats-total', totalTasks);
        setStat('stats-hours', totalHours.toFixed(1));
        setStat('stats-avg', (totalHours / totalTasks || 0).toFixed(1) + "h/t");

        // 시각화 렌더링
        renderPie(categories, totalTasks);
        renderBars(monthlyWorkload);
        
        // 보고서 생성
        generateReportText(data, categories, totalHours);
    }

    // 📊 시각화: 수제 Pie Chart (CSS Conic-Gradient)
    function renderPie(categories, total) {
        const pie = document.getElementById('chart-pie');
        const legend = document.getElementById('pie-legend');
        const colors = ['#00f2ff', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
        
        let currentPercent = 0;
        let gradientStr = "conic-gradient(";
        let legendHtml = "";

        const catEntries = Object.entries(categories);
        catEntries.forEach(([name, count], i) => {
            const percent = (count / total) * 100;
            const color = colors[i % colors.length];
            
            gradientStr += `${color} ${currentPercent}% ${currentPercent + percent}%, `;
            legendHtml += `
                <div class="legend-item">
                    <span class="dot" style="background:${color}"></span>
                    <span>${name} (${percent.toFixed(0)}%)</span>
                </div>`;
            
            currentPercent += percent;
        });

        pie.style.background = gradientStr.slice(0, -2) + ")";
        legend.innerHTML = legendHtml;
    }

    // 📊 시각화: 수제 Bar Chart (HTML/CSS)
    function renderBars(workload) {
        const container = document.getElementById('chart-bar');
        const maxVal = Math.max(...workload, 1);
        
        container.innerHTML = workload.map((val, i) => `
            <div class="bar-group">
                <div class="bar-item" style="height:${(val / maxVal) * 100}%" data-val="${val.toFixed(0)}"></div>
                <div class="bar-label">${i + 1}\uc6d4</div>
            </div>
        `).join('');
    }

    // 📝 보고서 자동 생성기 (Report Synthesis)
    function generateReportText(data, categories, totalHours) {
        const output = document.getElementById('reportOutput');
        const periodType = document.getElementById('periodType').value;
        const periodVal = document.getElementById('periodVal').value;

        const catStats = Object.entries(categories)
            .sort((a,b) => b[1] - a[1])
            .map(([name, count]) => `[${name}](${((count/data.length)*100).toFixed(0)}%)`)
            .join(', ');

        const topTasks = data.slice(0, 3).map(d => d.id).join(', ');

        const text = `[Pulse Command Center - 실적 리포트 v1.0]

위치: Secure Local Terminal
대상 기간: 2026\ub144 ${periodVal}${periodType === 'quarter' ? '\ubAC4\uae30' : '\uc6d4'}
분석 결과: 

1. 업무 수행 요약
총 ${data.length}\uac74\uc758 \uACFC\uc81C\ub97C \uc218\uD549\uD558\uC600\uC740\uBA70, \ucD1D \ud2ec\uc785 \uc2dc\uac04\uc740 ${totalHours.toFixed(1)}\uc2dc\uac04\uc73c\ub85c \uc911\uACC4\ub418\uc5c8\uc2b5\ub2c8\ub2e4. 

2. 리소스 투입 비중
${catStats} \uc21c\uc73c\ub85c \ub9ac\uc18c\uc2a4\uac00 \ud2ec\uc785\ub418\uc5c8\uc73c\uba70, \uc8fc\uc694 \ud575\uc2ec \uacfc\uc81C\ub85c\ub294 [${topTasks}] \ub4f1\uc774 \uc218\ud589 \uc644\ub8cc\ub420\uc2b5\ub2c8\ub2e4.

3. 종합 의견
\uc804\ubc18\uc801\uc778 \uc5c5\uBB34 \uc9D1\uc911\ub3C4\ub294 \uc548\uc815\uc801\uc774\uba70, \ud2b9\ud788 \uace0\ubd80\uac00\uac00\uce58 \uc5c5\uBB34\uc778 ${Object.keys(categories)[0]} \uce74\ud14c\uace0\ub9ac\uc5d0 \uc5ed\ub7c9\uc774 \uc911\uc810 \ubc30\uce58\ub418\uc5c8\uc74C\uc744 \ud655\uc778\ud558\uc600\uc2b5\ub2c8\ub2e4. \ud68C\uc2e0 \ubc14\ub78d\ub2c8\ub2e4.

---
[SYSTEM END]`;

        output.textContent = text;
    }

    // 📋 클립보드 복사
    copyBtn.onclick = () => {
        const text = document.getElementById('reportOutput').textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert("보고서가 클립보드에 복사되었습니다.");
        });
    };
});
