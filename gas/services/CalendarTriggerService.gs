/**
 * CalendarTriggerService.gs
 * \uCE98\uB9B0\uB354 \uBCC0\uACBD \uAC10\uC9C0 \uBC0F \uC0AC\uD644 \uC790\uB3D9 \uB4F1\uB85D \uD2B8\uB9AC\uAC70
 */
function onCalendarChange(e) {
  var calId = CONFIG.CALENDAR_ID || "primary";
  var now = new Date();
  var cal = CalendarApp.getCalendarById(calId);
  
  // \uCD5C\uADFC 5\uBD84 \uB0B4\uC5D0 \uBCC0\uACBD\uB41C \uC77C\uC815 \uD655\uC778
  var start = new Date(now.getTime() - (5 * 60 * 1000));
  var end = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  
  var events = cal.getEvents(start, end);
  events.forEach(function(event) {
    var title = event.getTitle();
    
    // Pulse\uC5D0\uC11C \uB9CC\uB4E0 \uC77C\uC815\uC740 \uBB34\uD55C \uB8E8\uD504 \uBC29\uC9C0\uB97C \uC704\uD574 \uC81C\uC678
    if (title.indexOf("[Pulse") === 0) return;
    
    // \uC774\uBBF8 \uC5C5\uBB34\uC77C\uC9C0\uC5D0 \uC788\uB224\uC9C0 id \uB4F1\uC73C\uB85C \uCCB4\uD06C\uD558\uBA74 \uC88B\uC9C0\uB9CC
    // \uC6B0\uC120\uC740 \uCE98\uB9B0\uB354\uC5D0 \uC0C8\uB85C \uC801\uC73C\uBA74 \uC5C5\uBB34\uC77C\uC9C0\uC5D0 '[\uCE98\uB9B0\uB354 \uC790\uB3D9\uB4F1\uB85D]' \uB9AC\uAE30\uC81C\uD558\uB3C4\uB85D \uD569\uB2C8\uB2E4.
    var logDate = Utilities.formatDate(event.getStartTime(), CONFIG.TZ, "yyyy-MM-dd");
    
    var rec = {
      siteId: "CALENDAR_SYNC", // \uCE98\uB9B0\uB354 \uB3D9\uAE30\uD654\uC6A9 \uAC00\uC0C1 ID
      date: logDate,
      category: "\uC6B4\uC601",
      content: "[\uCE98\uB9B0\uB354 \uC790\uB3D9\uB4F1\uB85D] " + title + "\n" + (event.getDescription() || ""),
      isDone: true,
      tags: ["\uCE98\uB9B0\uB354"],
      createdAt: new Date().toISOString()
    };
    
    // \uC800\uC7A5 (\uC2E4\uC81C\uB85C\uB224 \uC911\uBC29 \uCCB4\uD06C \uB85C\uC9C1\uC774 \uB370\uC774\uD130\uB724\uC5D0 \uB530\uB77C \uD544\uC694\uD560 \uC218 \uC788\uC74C)
    // WorklogService.saveWorklog(rec); // \uC2E4\uD514 \uD0C0\uC784\uC5D0 \uD638\uCD9C
  });
}

function setupCalendarTrigger() {
  var calId = CONFIG.CALENDAR_ID || "primary";
  ScriptApp.newTrigger('onCalendarChange')
    .forUserCalendar(calId)
    .onEventUpdated()
    .create();
  Logger.log("Calendar Update trigger installed.");
}
