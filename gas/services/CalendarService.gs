/**
 * CalendarService.gs
 * 업무 일지 - 구글 캘린더 양방향 연동 서비스
 */
var CalendarService = (function() {
  
  /**
   * 업무 일지 레코드를 캘린더 일정으로 등록 또는 업데이트
   */
  function syncWorklogToCalendar(rec) {
    try {
      var calId = CONFIG.CALENDAR_ID || "primary";
      var cal = CalendarApp.getCalendarById(calId);
      if (!cal) return { success: false, message: "Calendar not found" };

      var title = "[Pulse \uC5C5\uBB34] " + (rec.category || "\uAE30\uD0C0") + ": " + rec.content.substring(0, 30);
      var description = "\uCE21\uC131\uC790: " + rec.userId + "\n\uD0DC\uADF8: " + (rec.tags || "") + "\n\n" + rec.content;
      
      // \uAE30\uC874\uC5D0 \uC774\uBBF8 \uB4F1\uB85D\uB41C \uC77C\uC815\uC774 \uC788\uB294\uC9C0 \uD655\uC778 (\uBA54\uD0C0\uB370\uC774\uD130\uB85C logId \uD655\uC778 \uD611\uC758 \uD544\uC694\uD558\uC9C0\uB9CC \uC6B0\uC120 \uC2E0\uADDC \uC0DD\uC131)
      var eventDate = new Date(rec.date);
      var event = cal.createAllDayEvent(title, eventDate, {
        description: description,
        location: rec.siteId
      });

      // \uC77C\uC815 ID\uB97C Worklog\uC5D0 \uD45C\uAE30\uD560 \uC218 \uC788\uB304\uBA74 \uCD54\uACE0!
      return { success: true, eventId: event.getId() };
    } catch(e) {
      Logger.log("Calendar sync failed: " + e.toString());
      return { success: false, message: e.toString() };
    }
  }

  /**
   * \uCE98\uB9B0\uB354\uC5D0\uC11C \uC77C\uC815 \uAC00\uC9C8\uC624\uAE30 (\uC5ED\uBC29\uD5A5 \uB3D9\uAE30\uD654\uC6A9)
   */
  function getEventsFromCalendar(dateStr) {
    var calId = CONFIG.CALENDAR_ID || "primary";
    var cal = CalendarApp.getCalendarById(calId);
    if (!cal) return [];

    var d = new Date(dateStr);
    var start = new Date(d.setHours(0,0,0,0));
    var end = new Date(d.setHours(23,59,59,999));

    var events = cal.getEvents(start, end);
    return events.map(function(e) {
      return {
        title: e.getTitle(),
        description: e.getDescription(),
        id: e.getId()
      };
    });
  }

  return {
    syncWorklogToCalendar: syncWorklogToCalendar,
    getEventsFromCalendar: getEventsFromCalendar
  };
})();
