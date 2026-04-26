/**
 * JarvisService.gs
 * Neural Core Intelligence & Operational Briefing Service
 */
var JarvisService = (function () {

  /**
   * 자비스의 지능형 브리핑 생성
   */
  function getBriefing(req) {
    // 1. 현재 운영지표 수집 (최근 7일 분석)
    var metrics = MetricsRepository.getDashboardMetrics(req.siteId) || [];
    var insights = InsightService.getInsights(req) || { items: [] };
    
    var message = "자비스 코어 정상 부팅 완료. 현재 모든 모듈이 최적의 상태로 작동 중입니다.";
    var level = "INFO";
    var skills = [
      { name: "CORE", status: "active", pos: { top: 130, left: 140 } },
      { name: "SYNC", status: "active", pos: { top: 60, left: 240 } },
      { name: "CALC", status: "active", pos: { top: 200, left: 40 } },
      { name: "REPORT", status: "locked", pos: { top: 200, left: 240 } }
    ];

    // 2. 운영 이슈 탐지 로직 (예: 미조치 인사이트 발견 시)
    var activeIssues = insights.items.filter(function(i){ return i.status !== 'DONE'; });
    if (activeIssues.length > 0) {
      message = "주의: " + activeIssues.length + "개의 미조치 운영 리스크가 감지되었습니다. 'Insights' 탭을 확인하십시오.";
      level = "WARN";
      skills[1].status = "alert"; // SYNC 노드 상태 변경
    }

    // 3. 인당량 분석 오차 탐지 (임시 필터)
    // 실제 데이터와 비교하여 자율 브리핑 생성 가능

    return {
      success: true,
      briefing: {
        message: message,
        level: level,
        timestamp: new Date().toISOString()
      },
      skills: skills
    };
  }

  return {
    getBriefing: getBriefing
  };
})();
