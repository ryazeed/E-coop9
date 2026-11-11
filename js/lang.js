/* =====================================================================
   E-COOP - all interface text in English and Arabic (I18N.en / I18N.ar),
   status names in Arabic, and the list of Saudi cities.
   Loaded in the <head> of every page so Arabic pages open right-to-left.
   ===================================================================== */

var I18N = {
  en: {
    appTagline: 'Cooperative Training Management System',
    college: 'Jubail Industrial College · Department of Business Administration',
    signInTitle: 'Sign in to E-COOP',
    signInLead: 'This is a working demo with sample records. Choose an account to see E-COOP from that role. Changes you make are shared across all accounts in this browser.',
    demoAccounts: 'Demo accounts',
    continueAs: 'Continue',
    resetDemo: 'Reset demo data',
    resetDone: 'Demo data reset.',
    switchAccount: 'Switch account',
    language: 'العربية',
    theme: 'Theme',
    roleStudent: 'Student', roleCompany: 'Company', roleSupervisor: 'Supervisor', roleAdmin: 'Admin',
    descFaisal: 'Placed at Eastern Logistics. Log attendance, submit the final report.',
    descReem: 'No placement yet. Browse and apply for opportunities.',
    descCompany: 'Eastern Logistics Co. Post opportunities, review applicants, generate daily codes.',
    descSupervisor: 'Abdullah Rashed Alrumi. Monitor students, approve attendance, review reports.',
    descAdmin: 'COOP Office. Approve companies and opportunities, manage users, view analytics.',
    /* nav */
    navDashboard: 'Dashboard', navOpportunities: 'Opportunities', navApplications: 'Applications', navAttendance: 'Attendance', navReport: 'Final Report', navProfile: 'Profile',
    navOverview: 'Overview', navPostings: 'Postings', navApplicants: 'Applicants', navDailyCode: 'Daily Code', navTrainees: 'Trainees',
    navStudents: 'Students', navReports: 'Reports', navEvaluations: 'Evaluations',
    navAnalytics: 'Analytics', navApprovals: 'Approvals', navUsers: 'Users', navAssign: 'Assign Supervisors', navAudit: 'Audit Log',
    /* common */
    student: 'Student', company: 'Company', opportunity: 'Opportunity', status: 'Status', date: 'Date', submitted: 'Submitted', actions: 'Actions',
    city: 'City', majors: 'Majors', seats: 'Seats', major: 'Major', supervisor: 'Supervisor', placement: 'Placement', score: 'Score', comments: 'Comments', type: 'Type',
    approve: 'Approve', reject: 'Reject', accept: 'Accept', review: 'Review', cancel: 'Cancel', save: 'Save', none: 'None', all: 'All',
    unassigned: 'Unassigned', noRecords: 'No records yet.', demo: 'Demo',
    /* student */
    hello: 'Welcome back', yourPlacement: 'Your placement', noPlacementTitle: 'You don’t have a placement yet',
    noPlacementBody: 'Browse approved opportunities that match your major and apply. Your applications and their status appear under Applications.',
    browseOpps: 'Browse COOP Opportunities', attendanceRate: 'Attendance rate', daysLogged: 'Days logged', appsSent: 'Applications', finalReport: 'Final report',
    notSubmitted: 'Not submitted', checkInToday: 'Log today’s attendance', checkedInToday: 'You checked in today at',
    logAttendance: 'Log Attendance', searchOpps: 'Search by title or company', filterMajor: 'Major', filterCity: 'City',
    apply: 'Apply', full: 'No seats left', applied: 'Applied', viewApplication: 'View application', postedOn: 'Posted',
    alreadyPlaced: 'You have an active placement, so you can’t apply for another opportunity.',
    appliedToast: 'Application submitted. The company will review it.',
    oppsFound: 'opportunities', noOppsMatch: 'No opportunities match these filters. Clear a filter to see more.',
    myApplications: 'My Applications', appliedOn: 'Applied', noApps: 'You haven’t applied for any opportunity yet.',
    attendanceTitle: 'Attendance', codeLabel: 'Today’s attendance code', codeHelp: 'Enter the six-digit code from your company supervisor.',
    demoCodeHint: 'Demo: today’s code is shown on the Company account’s Daily Code page.',
    codeInvalid: 'Invalid code. Check the six digits with your company supervisor.',
    codeExpired: 'This code expired at midnight. Ask your company for today’s code.',
    codeDuplicate: 'You already checked in today. Each daily code can be used once.',
    codeNone: 'Your company hasn’t generated today’s code yet. Try again later.',
    codeOk: 'Attendance recorded at', awaitingApproval: 'It is waiting for your supervisor’s approval.',
    history: 'History', checkInTime: 'Check-in', noPlacementAttendance: 'Attendance opens once you have an active placement.',
    reportTitle: 'Final Training Report', reportLead: 'Submit one final report at the end of your placement. Your academic supervisor reviews it.',
    reportFile: 'Report file', submitReport: 'Submit Training Report', reportSubmitted: 'Report submitted. Your supervisor will review it.',
    fileTypeError: 'File must be PDF or DOCX, 10 MB or smaller.', chooseFile: 'Choose a file or drag it here', fileHint: 'PDF or DOCX, max 10 MB', remove: 'Remove',
    revisionNote: 'Your supervisor requested a revision. Upload an updated file.',
    reportApproved: 'Your final report was approved.', evaluations: 'Evaluations', noEvals: 'No evaluations yet. They appear here when your company and supervisor submit them.',
    profileTitle: 'Profile', fullName: 'Full name', email: 'University email', phone: 'Phone', gpa: 'GPA', cv: 'CV', saveProfile: 'Save Profile', profileSaved: 'Profile saved.',
    phoneError: 'Enter a Saudi mobile number starting with 05, 10 digits.', gpaError: 'GPA must be between 0 and 5.',
    /* company */
    companyOverview: 'Company Overview', activeTrainees: 'Active trainees', openPostings: 'Open postings', newApplicants: 'New applicants', todaysCheckins: 'Today’s check-ins',
    postOpp: 'Post Opportunity', postTitle: 'Post a New Opportunity', oppTitle: 'Opportunity title', description: 'Description', capacity: 'Capacity',
    majorReq: 'Major requirements', postHelp: 'New postings stay hidden from students until an admin approves them.', postedToast: 'Opportunity posted. It is pending admin approval.',
    titleRequired: 'Enter a title of at least 5 characters.', capacityError: 'Capacity must be between 1 and 20.', descRequired: 'Describe the role in at least 20 characters.',
    myPostings: 'Your Postings', applicantsTitle: 'Applicants', acceptedToast: 'Applicant accepted and added to the placement.', rejectedToast: 'Applicant rejected.',
    dailyCodeTitle: 'Daily Attendance Code', generateCode: 'Generate Daily Code', regenerateCode: 'Regenerate Code', codeGenerated: 'New code generated. The previous code no longer works.',
    expiresToday: 'Expires 23:59 today', checkedIn: 'checked in', noCodeYet: 'No code generated for today yet.', recentCodes: 'Recent codes',
    traineesTitle: 'Trainees', evaluate: 'Evaluate', submitEval: 'Submit Evaluation', evalSaved: 'Evaluation submitted.', scoreHelp: '0 to 100', scoreError: 'Score must be a whole number from 0 to 100.',
    commentsRequired: 'Add a comment of at least 10 characters.', evaluated: 'Evaluated', companyEval: 'Company', academicEval: 'Academic',
    /* supervisor */
    myStudents: 'Assigned Students', pendingAttendance: 'Pending attendance', reportsToReview: 'Reports to review',
    attendanceApprovals: 'Attendance Approvals', approveAll: 'Approve All', nothingPending: 'Nothing waiting for approval.',
    reportsTitle: 'Training Reports', requestRevision: 'Request Revision', reportApprovedToast: 'Report approved.', revisionToast: 'Revision requested.',
    academicEvalTitle: 'Academic Evaluations', file: 'File',
    /* admin */
    analyticsTitle: 'Institutional Analytics', placementRate: 'Placement rate', placedOf: 'students placed', activePlacements: 'Active placements',
    pendingApprovals: 'Pending approvals', companiesShort: 'companies', opportunitiesShort: 'opportunities', placementsByCompany: 'Trainees by company',
    approvalsTitle: 'Approvals', companiesPending: 'Companies', oppsPending: 'Opportunities', approvedToast: 'Approved.', rejectedToast2: 'Rejected.',
    usersTitle: 'User Accounts', role: 'Role', suspend: 'Suspend', activate: 'Activate', suspendedToast: 'Account suspended. The user can no longer sign in.', activatedToast: 'Account activated.',
    assignTitle: 'Assign Academic Supervisors', assignHelp: 'Each student has exactly one academic supervisor.', assignedToast: 'Supervisor assigned.',
    auditTitle: 'Audit Log', user: 'User', action: 'Action', time: 'Time', filterUser: 'Filter by user',
    suspendedSignIn: 'This account is suspended. Contact the COOP office to reactivate it.'
  },
  ar: {
    appTagline: 'نظام إدارة التدريب التعاوني',
    college: 'كلية الجبيل الصناعية · قسم إدارة الأعمال',
    signInTitle: 'تسجيل الدخول إلى E-COOP',
    signInLead: 'هذه نسخة تجريبية تعمل ببيانات نموذجية. اختر حسابًا لتشاهد النظام من ذلك الدور. التغييرات التي تجريها مشتركة بين جميع الحسابات في هذا المتصفح.',
    demoAccounts: 'الحسابات التجريبية',
    continueAs: 'متابعة',
    resetDemo: 'إعادة ضبط البيانات',
    resetDone: 'تمت إعادة ضبط البيانات التجريبية.',
    switchAccount: 'تبديل الحساب',
    language: 'English',
    theme: 'المظهر',
    roleStudent: 'طالب', roleCompany: 'جهة تدريب', roleSupervisor: 'مشرف أكاديمي', roleAdmin: 'مسؤول',
    descFaisal: 'متدرب في شركة الشرقية للخدمات اللوجستية. سجّل الحضور وارفع التقرير النهائي.',
    descReem: 'لا يوجد تدريب بعد. تصفّح الفرص وقدّم عليها.',
    descCompany: 'شركة الشرقية للخدمات اللوجستية. انشر الفرص وراجع المتقدمين وأنشئ رموز الحضور.',
    descSupervisor: 'عبدالله راشد الرومي. تابع الطلاب واعتمد الحضور وراجع التقارير.',
    descAdmin: 'مكتب التدريب التعاوني. اعتمد الجهات والفرص وأدر المستخدمين واطّلع على التحليلات.',
    navDashboard: 'الرئيسية', navOpportunities: 'الفرص', navApplications: 'طلباتي', navAttendance: 'الحضور', navReport: 'التقرير النهائي', navProfile: 'الملف الشخصي',
    navOverview: 'نظرة عامة', navPostings: 'الفرص المنشورة', navApplicants: 'المتقدمون', navDailyCode: 'رمز الحضور', navTrainees: 'المتدربون',
    navStudents: 'الطلاب', navReports: 'التقارير', navEvaluations: 'التقييمات',
    navAnalytics: 'التحليلات', navApprovals: 'الاعتمادات', navUsers: 'المستخدمون', navAssign: 'تعيين المشرفين', navAudit: 'سجل التدقيق',
    student: 'الطالب', company: 'الجهة', opportunity: 'الفرصة', status: 'الحالة', date: 'التاريخ', submitted: 'تاريخ التقديم', actions: 'الإجراءات',
    city: 'المدينة', majors: 'التخصصات', seats: 'المقاعد', major: 'التخصص', supervisor: 'المشرف', placement: 'جهة التدريب', score: 'الدرجة', comments: 'الملاحظات', type: 'النوع',
    approve: 'اعتماد', reject: 'رفض', accept: 'قبول', review: 'مراجعة', cancel: 'إلغاء', save: 'حفظ', none: 'لا يوجد', all: 'الكل',
    unassigned: 'غير معيّن', noRecords: 'لا توجد سجلات بعد.', demo: 'تجريبي',
    hello: 'مرحبًا بعودتك', yourPlacement: 'جهة تدريبك', noPlacementTitle: 'لم يتم تعيينك في جهة تدريب بعد',
    noPlacementBody: 'تصفّح الفرص المعتمدة المناسبة لتخصصك وقدّم عليها. تظهر طلباتك وحالتها في صفحة طلباتي.',
    browseOpps: 'تصفّح فرص التدريب', attendanceRate: 'نسبة الحضور', daysLogged: 'أيام الحضور', appsSent: 'الطلبات', finalReport: 'التقرير النهائي',
    notSubmitted: 'لم يُرفع', checkInToday: 'سجّل حضور اليوم', checkedInToday: 'سجّلت حضورك اليوم الساعة',
    logAttendance: 'تسجيل الحضور', searchOpps: 'ابحث بالمسمى أو الجهة', filterMajor: 'التخصص', filterCity: 'المدينة',
    apply: 'تقديم', full: 'اكتملت المقاعد', applied: 'تم التقديم', viewApplication: 'عرض الطلب', postedOn: 'نُشرت',
    alreadyPlaced: 'لديك تدريب نشط، لذا لا يمكنك التقديم على فرصة أخرى.',
    appliedToast: 'تم إرسال الطلب. ستراجعه الجهة.',
    oppsFound: 'فرصة', noOppsMatch: 'لا توجد فرص تطابق هذه المرشحات. أزل أحد المرشحات لعرض المزيد.',
    myApplications: 'طلباتي', appliedOn: 'تاريخ التقديم', noApps: 'لم تقدّم على أي فرصة بعد.',
    attendanceTitle: 'الحضور', codeLabel: 'رمز حضور اليوم', codeHelp: 'أدخل الرمز المكوّن من ستة أرقام من مشرفك في الجهة.',
    demoCodeHint: 'تجريبي: رمز اليوم يظهر في صفحة رمز الحضور بحساب الجهة.',
    codeInvalid: 'رمز غير صحيح. تحقق من الأرقام الستة مع مشرفك في الجهة.',
    codeExpired: 'انتهت صلاحية هذا الرمز عند منتصف الليل. اطلب رمز اليوم من الجهة.',
    codeDuplicate: 'سجّلت حضورك اليوم مسبقًا. يُستخدم كل رمز مرة واحدة.',
    codeNone: 'لم تُنشئ الجهة رمز اليوم بعد. حاول لاحقًا.',
    codeOk: 'تم تسجيل الحضور الساعة', awaitingApproval: 'بانتظار اعتماد مشرفك الأكاديمي.',
    history: 'السجل', checkInTime: 'وقت الحضور', noPlacementAttendance: 'يتاح تسجيل الحضور عند تعيينك في جهة تدريب.',
    reportTitle: 'تقرير التدريب النهائي', reportLead: 'ارفع تقريرًا نهائيًا واحدًا في نهاية التدريب، ويراجعه مشرفك الأكاديمي.',
    reportFile: 'ملف التقرير', submitReport: 'رفع التقرير', reportSubmitted: 'تم رفع التقرير. سيراجعه مشرفك.',
    fileTypeError: 'يجب أن يكون الملف PDF أو DOCX بحجم 10 ميجابايت أو أقل.', chooseFile: 'اختر ملفًا أو اسحبه هنا', fileHint: 'PDF أو DOCX، بحد أقصى 10 ميجابايت', remove: 'إزالة',
    revisionNote: 'طلب مشرفك تعديل التقرير. ارفع نسخة محدّثة.',
    reportApproved: 'تم اعتماد تقريرك النهائي.', evaluations: 'التقييمات', noEvals: 'لا توجد تقييمات بعد. تظهر هنا عندما ترفعها الجهة والمشرف.',
    profileTitle: 'الملف الشخصي', fullName: 'الاسم الكامل', email: 'البريد الجامعي', phone: 'الجوال', gpa: 'المعدل', cv: 'السيرة الذاتية', saveProfile: 'حفظ الملف', profileSaved: 'تم حفظ الملف.',
    phoneError: 'أدخل رقم جوال سعودي يبدأ بـ 05 من 10 أرقام.', gpaError: 'يجب أن يكون المعدل بين 0 و5.',
    companyOverview: 'نظرة عامة على الجهة', activeTrainees: 'المتدربون النشطون', openPostings: 'الفرص المفتوحة', newApplicants: 'متقدمون جدد', todaysCheckins: 'حضور اليوم',
    postOpp: 'نشر فرصة', postTitle: 'نشر فرصة جديدة', oppTitle: 'مسمى الفرصة', description: 'الوصف', capacity: 'عدد المقاعد',
    majorReq: 'التخصصات المطلوبة', postHelp: 'تبقى الفرص الجديدة مخفية عن الطلاب حتى يعتمدها المسؤول.', postedToast: 'تم نشر الفرصة وهي بانتظار اعتماد المسؤول.',
    titleRequired: 'أدخل مسمى من 5 أحرف على الأقل.', capacityError: 'يجب أن يكون عدد المقاعد بين 1 و20.', descRequired: 'صف الدور في 20 حرفًا على الأقل.',
    myPostings: 'فرصك المنشورة', applicantsTitle: 'المتقدمون', acceptedToast: 'تم قبول المتقدم وإضافته إلى التدريب.', rejectedToast: 'تم رفض المتقدم.',
    dailyCodeTitle: 'رمز الحضور اليومي', generateCode: 'إنشاء رمز اليوم', regenerateCode: 'إعادة إنشاء الرمز', codeGenerated: 'تم إنشاء رمز جديد، ولم يعد الرمز السابق صالحًا.',
    expiresToday: 'ينتهي 23:59 اليوم', checkedIn: 'سجّلوا الحضور', noCodeYet: 'لم يُنشأ رمز لليوم بعد.', recentCodes: 'الرموز السابقة',
    traineesTitle: 'المتدربون', evaluate: 'تقييم', submitEval: 'رفع التقييم', evalSaved: 'تم رفع التقييم.', scoreHelp: 'من 0 إلى 100', scoreError: 'يجب أن تكون الدرجة عددًا صحيحًا من 0 إلى 100.',
    commentsRequired: 'أضف ملاحظة من 10 أحرف على الأقل.', evaluated: 'تم التقييم', companyEval: 'الجهة', academicEval: 'أكاديمي',
    myStudents: 'الطلاب المعيّنون', pendingAttendance: 'حضور بانتظار الاعتماد', reportsToReview: 'تقارير للمراجعة',
    attendanceApprovals: 'اعتماد الحضور', approveAll: 'اعتماد الكل', nothingPending: 'لا يوجد ما ينتظر الاعتماد.',
    reportsTitle: 'تقارير التدريب', requestRevision: 'طلب تعديل', reportApprovedToast: 'تم اعتماد التقرير.', revisionToast: 'تم طلب التعديل.',
    academicEvalTitle: 'التقييمات الأكاديمية', file: 'الملف',
    analyticsTitle: 'تحليلات الكلية', placementRate: 'نسبة التسكين', placedOf: 'طالبًا تم تسكينهم', activePlacements: 'جهات التدريب النشطة',
    pendingApprovals: 'بانتظار الاعتماد', companiesShort: 'جهات', opportunitiesShort: 'فرص', placementsByCompany: 'المتدربون حسب الجهة',
    approvalsTitle: 'الاعتمادات', companiesPending: 'الجهات', oppsPending: 'الفرص', approvedToast: 'تم الاعتماد.', rejectedToast2: 'تم الرفض.',
    usersTitle: 'حسابات المستخدمين', role: 'الدور', suspend: 'إيقاف', activate: 'تفعيل', suspendedToast: 'تم إيقاف الحساب ولن يتمكن المستخدم من الدخول.', activatedToast: 'تم تفعيل الحساب.',
    assignTitle: 'تعيين المشرفين الأكاديميين', assignHelp: 'لكل طالب مشرف أكاديمي واحد فقط.', assignedToast: 'تم تعيين المشرف.',
    auditTitle: 'سجل التدقيق', user: 'المستخدم', action: 'الإجراء', time: 'الوقت', filterUser: 'تصفية حسب المستخدم',
    suspendedSignIn: 'هذا الحساب موقوف. تواصل مع مكتب التدريب التعاوني لإعادة تفعيله.'
  }
};
var STATUS_AR = { 'Active': 'نشط', 'Suspended': 'موقوف', 'Pending': 'قيد الانتظار', 'Pending Approval': 'بانتظار الاعتماد', 'Pending Evaluation': 'بانتظار التقييم',
  'Request Revision': 'مطلوب تعديل', 'Approved': 'معتمد', 'Accepted': 'مقبول', 'Rejected': 'مرفوض', 'Submitted': 'مُرسل', 'Open': 'مفتوحة', 'Completed': 'مكتمل', 'Expired': 'منتهي', 'Not submitted': 'لم يُرفع', 'Evaluated': 'تم التقييم' };

/* Strings added for the FamilyLink-style redesign and usability fixes */
Object.assign(I18N.en, {
  nNewAdmin: 'New admin account: {n} ({e}). Check the Users page if you didn\u2019t expect this.',
  nNewSupervisor: 'New academic supervisor: {n} ({dp}). Assign students under Assign Supervisors.',
  nNewStudent: 'New student account: {n}. Assign an academic supervisor.', companyPendingTitle: 'Your company is waiting for approval', companyPendingBody: 'The COOP office reviews new companies before they can post opportunities. You will get a notification when it\u2019s approved.',
  nContact: 'Contact form \u00b7 {x} from {n} ({e}): {m}',
  belowPass: 'Below 60',
  changePhoto: 'Change photo', addPhoto: 'Add photo', removePhoto: 'Remove photo', photoHint: 'PNG, JPG or WebP, up to 5 MB.', photoUpdated: 'Profile photo updated.', photoRemoved: 'Profile photo removed.', photoTooBig: 'That photo is larger than 5 MB. Choose a smaller one.', photoType: 'Choose a PNG, JPG or WebP image.',
  openReport: 'Open', openFile: 'Open report', reportsLead: 'Open a report to read it, then approve it or request a revision.', loadingFile: 'Opening the file\u2026', pagesWord: 'pages', pageN: 'Page {n} of {m}', sampleNote: 'Sample report from the demo data. Reports that students upload open as the real PDF or Word file.', missingFile: 'This file was uploaded on another device, so it can\u2019t be opened here. In this demo, files stay in the browser they were uploaded from.', noViewer: 'The document viewer couldn\u2019t load. Check your internet connection and try again.', fileError: 'This file couldn\u2019t be opened. It may be damaged; ask the student to upload it again.', storageError: 'The file couldn\u2019t be saved in this browser. Free up space or try another browser, then submit again.',
  yourProgress: 'Your progress', stepPlacement: 'Placement', stepTraining: 'Training', stepReport: 'Final report', stepEvals: 'Evaluations', stepDone: 'Done', stepNotYet: 'Not yet', stepDays: 'days', nextStep: 'Next', nextApply: 'apply for an opportunity that matches your major.', nextCheckIn: 'log today\u2019s attendance with the daily code.', nextRevision: 'upload the revised final report.', nextKeepGoing: 'keep logging attendance every training day.', nextReport: 'submit your final training report.', nextEvals: 'wait for your company and supervisor evaluations.',
  goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
  navSettings: 'Settings', notifications: 'Notifications', markAllRead: 'Mark all as read', noNotifs: 'You’re all caught up.', close: 'Close', undo: 'Undo', undone: 'Change undone.',
  quickActions: 'Quick actions', activity: 'Recent activity', activityLead: 'What happened on your placements lately.', noActivity: 'No activity yet.', seeAll: 'See all',
  today: 'Today', yesterday: 'Yesterday', daysAgo: '{n} days ago',
  termProgress: 'Attendance this term', todayStatus: 'Today', checkedInShort: 'Checked in', notCheckedIn: 'Not checked in yet',
  pendingItems: 'Waiting for you', trainingDay: 'Training day {n} of {m}',
  /* activity templates */
  aCheckIn: '{n} checked in at {x}', aApplied: '{n} applied for {o}', aAccepted: '{n} was accepted for {o}', aRejectedApp: '{n}’s application for {o} was rejected',
  aReport: '{n} submitted the final report', aEval: '{n} received a {x} evaluation: {s}/100', aYouCheckIn: 'You checked in at {x}',
  /* notifications */
  nAttApproved: 'Your attendance for {d} was approved.', nAttRejected: 'Your attendance for {d} was rejected. Contact your supervisor.', nCodeReminder: 'Reminder: log today’s attendance with the daily code.',
  nAppAccepted: 'You were accepted for {o}.', nAppRejected: 'Your application for {o} was not accepted.', nWelcome: 'Welcome to E-COOP. Start by browsing opportunities for your major.',
  nNewApp: '{n} applied for {o}.', nOppPending: '{o} is waiting for admin approval.', nOppApproved: '{o} was approved and is now visible to students.', nOppRejected: '{o} was not approved.',
  nReportIn: '{n} submitted a final report.', nAttPending: '{c} attendance records are waiting for your approval.', nReportApproved: 'Your final report was approved.', nReportRevision: 'Your supervisor asked for a revision of your final report.',
  nCompanyPending: '{n} registered and is waiting for approval.', nOppNew: 'New opportunity to review: {o}.', nEvalIn: 'You received a {x} evaluation: {s}/100.', nCheckIn: '{n} checked in and is waiting for approval.',
  nSupervisor: '{n} is now your academic supervisor.',
  /* onboarding */
  tourSkip: 'Skip tour', tourNext: 'Next', tourBack: 'Back', tourDone: 'Get started', tourStep: 'Step {n} of {m}', showTour: 'Show the tour again',
  tStudent1t: 'Find your placement', tStudent1d: 'Open Opportunities to see approved placements for your major. Apply once per opportunity and follow its status under Applications.',
  tStudent2t: 'Check in every training day', tStudent2d: 'Your company shows a six-digit code each morning. Enter it under Attendance. It expires at midnight.',
  tStudent3t: 'Finish with your report', tStudent3d: 'Upload your final report as PDF or DOCX. Your supervisor approves it or asks for a revision, and you get a notification either way.',
  tCompany1t: 'Post opportunities', tCompany1d: 'Use a quick template or write your own. New postings stay hidden until the COOP office approves them.',
  tCompany2t: 'Review applicants', tCompany2d: 'Accept or reject each applicant. Accepted students join your placement right away. You can undo a decision for a few seconds.',
  tCompany3t: 'Generate the daily code', tCompany3d: 'Each morning, show trainees the code from Daily Code. Regenerating it cancels the previous one.',
  tSupervisor1t: 'Your students at a glance', tSupervisor1d: 'Tap a student card to see attendance, the final report and evaluations in one place.',
  tSupervisor2t: 'Approve attendance', tSupervisor2d: 'Check-ins wait for your approval. Approve them one by one or all at once, and undo if you tap the wrong one.',
  tSupervisor3t: 'Review and evaluate', tSupervisor3d: 'Approve final reports or request a revision, then submit an academic score from 0 to 100.',
  tAdmin1t: 'Approve before anything goes live', tAdmin1d: 'Companies and opportunities stay hidden from students until you approve them under Approvals.',
  tAdmin2t: 'Manage accounts', tAdmin2d: 'Suspend or reactivate accounts and assign an academic supervisor to every student.',
  tAdmin3t: 'Track the term', tAdmin3d: 'Analytics shows placement and attendance rates. Every admin action is recorded in the Audit Log.',
  /* settings */
  settingsTitle: 'Settings', profileSection: 'Profile', notifSection: 'Notifications', appearance: 'Appearance', languageLabel: 'Language', themeLabel: 'Theme',
  themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark', signOut: 'Sign out', helpSection: 'Help',
  pAttendance: 'Attendance reminders', pAttendanceD: 'A reminder each training morning to log the daily code',
  pApplications: 'Application updates', pApplicationsD: 'When an application is accepted, rejected or received',
  pReports: 'Reports and evaluations', pReportsD: 'When a report is reviewed or an evaluation is submitted',
  pSummary: 'Weekly summary', pSummaryD: 'A short summary every Thursday afternoon',
  prefSaved: 'Notification setting saved.',
  /* templates + stepper */
  quickTemplates: 'Quick templates', templatesHelp: 'Pick one to fill the form, then edit anything.', decrease: 'Decrease', increase: 'Increase',
  studentDetails: 'Student details', recentCheckins: 'Recent check-ins', viewDetails: 'View details',
  fixErrors: 'Fix the highlighted fields to continue.', charsLeft: '{n} more characters needed'
});
Object.assign(I18N.ar, {
  nNewAdmin: 'حساب مسؤول جديد: {n} ({e}). راجع صفحة المستخدمين إذا لم يكن متوقعًا.',
  nNewSupervisor: 'مشرف أكاديمي جديد: {n} ({dp}). عيّن له الطلاب من صفحة تعيين المشرفين.',
  nNewStudent: 'حساب طالب جديد: {n}. عيّن له مشرفًا أكاديميًا.', companyPendingTitle: 'جهتك بانتظار الاعتماد', companyPendingBody: 'يراجع مكتب التدريب الجهات الجديدة قبل أن تتمكن من نشر الفرص، وسيصلك إشعار عند الاعتماد.',
  nContact: 'نموذج التواصل \u00b7 {x} من {n} ({e}): {m}',
  belowPass: 'أقل من 60',
  changePhoto: 'تغيير الصورة', addPhoto: 'إضافة صورة', removePhoto: 'إزالة الصورة', photoHint: 'PNG أو JPG أو WebP بحد أقصى 5 ميجابايت.', photoUpdated: 'تم تحديث الصورة الشخصية.', photoRemoved: 'تمت إزالة الصورة الشخصية.', photoTooBig: 'حجم الصورة أكبر من 5 ميجابايت. اختر صورة أصغر.', photoType: 'اختر صورة بصيغة PNG أو JPG أو WebP.',
  openReport: 'فتح', openFile: 'فتح التقرير', reportsLead: 'افتح التقرير لقراءته ثم اعتمده أو اطلب تعديله.', loadingFile: 'جارٍ فتح الملف\u2026', pagesWord: 'صفحات', pageN: 'الصفحة {n} من {m}', sampleNote: 'تقرير نموذجي من البيانات التجريبية. التقارير التي يرفعها الطلاب تُفتح كملف PDF أو Word الحقيقي.', missingFile: 'رُفع هذا الملف من جهاز آخر، لذا لا يمكن فتحه هنا. في هذه النسخة التجريبية تبقى الملفات في المتصفح الذي رُفعت منه.', noViewer: 'تعذّر تحميل عارض المستندات. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.', fileError: 'تعذّر فتح الملف، وقد يكون تالفًا. اطلب من الطالب رفعه مرة أخرى.', storageError: 'تعذّر حفظ الملف في هذا المتصفح. أفرغ بعض المساحة أو جرّب متصفحًا آخر ثم أعد الإرسال.',
  yourProgress: 'تقدّمك', stepPlacement: 'التسكين', stepTraining: 'التدريب', stepReport: 'التقرير النهائي', stepEvals: 'التقييمات', stepDone: 'تم', stepNotYet: 'لم يتم بعد', stepDays: 'يومًا', nextStep: 'الخطوة التالية', nextApply: 'قدّم على فرصة تناسب تخصصك.', nextCheckIn: 'سجّل حضور اليوم بالرمز اليومي.', nextRevision: 'ارفع التقرير النهائي بعد التعديل.', nextKeepGoing: 'واصل تسجيل الحضور كل يوم تدريب.', nextReport: 'ارفع تقرير التدريب النهائي.', nextEvals: 'انتظر تقييم الجهة والمشرف.',
  goodMorning: 'صباح الخير', goodAfternoon: 'مساء الخير', goodEvening: 'مساء الخير',
  navSettings: 'الإعدادات', notifications: 'الإشعارات', markAllRead: 'تعليم الكل كمقروء', noNotifs: 'لا توجد إشعارات جديدة.', close: 'إغلاق', undo: 'تراجع', undone: 'تم التراجع عن التغيير.',
  quickActions: 'إجراءات سريعة', activity: 'آخر النشاطات', activityLead: 'ما حدث مؤخرًا في التدريب.', noActivity: 'لا يوجد نشاط بعد.', seeAll: 'عرض الكل',
  today: 'اليوم', yesterday: 'أمس', daysAgo: 'قبل {n} أيام',
  termProgress: 'الحضور هذا الفصل', todayStatus: 'اليوم', checkedInShort: 'تم تسجيل الحضور', notCheckedIn: 'لم يُسجَّل الحضور بعد',
  pendingItems: 'بانتظارك', trainingDay: 'يوم التدريب {n} من {m}',
  aCheckIn: 'سجّل {n} الحضور الساعة {x}', aApplied: 'قدّم {n} على {o}', aAccepted: 'تم قبول {n} في {o}', aRejectedApp: 'تم رفض طلب {n} على {o}',
  aReport: 'رفع {n} التقرير النهائي', aEval: 'حصل {n} على تقييم {x}: {s}/100', aYouCheckIn: 'سجّلت حضورك الساعة {x}',
  nAttApproved: 'تم اعتماد حضورك بتاريخ {d}.', nAttRejected: 'تم رفض حضورك بتاريخ {d}. تواصل مع مشرفك.', nCodeReminder: 'تذكير: سجّل حضور اليوم بالرمز اليومي.',
  nAppAccepted: 'تم قبولك في {o}.', nAppRejected: 'لم يتم قبول طلبك على {o}.', nWelcome: 'مرحبًا بك في E-COOP. ابدأ بتصفح الفرص المناسبة لتخصصك.',
  nNewApp: 'قدّم {n} على {o}.', nOppPending: '{o} بانتظار اعتماد المسؤول.', nOppApproved: 'تم اعتماد {o} وأصبحت ظاهرة للطلاب.', nOppRejected: 'لم يتم اعتماد {o}.',
  nReportIn: 'رفع {n} التقرير النهائي.', nAttPending: '{c} سجلات حضور بانتظار اعتمادك.', nReportApproved: 'تم اعتماد تقريرك النهائي.', nReportRevision: 'طلب مشرفك تعديل تقريرك النهائي.',
  nCompanyPending: 'سجّلت {n} وهي بانتظار الاعتماد.', nOppNew: 'فرصة جديدة للمراجعة: {o}.', nEvalIn: 'حصلت على تقييم {x}: {s}/100.', nCheckIn: 'سجّل {n} الحضور وينتظر الاعتماد.',
  nSupervisor: 'أصبح {n} مشرفك الأكاديمي.',
  tourSkip: 'تخطي الجولة', tourNext: 'التالي', tourBack: 'السابق', tourDone: 'ابدأ الآن', tourStep: 'الخطوة {n} من {m}', showTour: 'عرض الجولة مرة أخرى',
  tStudent1t: 'ابحث عن جهة تدريبك', tStudent1d: 'افتح صفحة الفرص لتشاهد الفرص المعتمدة لتخصصك. قدّم مرة واحدة لكل فرصة وتابع حالتها في طلباتي.',
  tStudent2t: 'سجّل حضورك كل يوم تدريب', tStudent2d: 'تعرض الجهة رمزًا من ستة أرقام كل صباح. أدخله في صفحة الحضور، وينتهي عند منتصف الليل.',
  tStudent3t: 'اختم بالتقرير', tStudent3d: 'ارفع تقريرك النهائي بصيغة PDF أو DOCX. يعتمده مشرفك أو يطلب تعديله، ويصلك إشعار في الحالتين.',
  tCompany1t: 'انشر الفرص', tCompany1d: 'استخدم قالبًا جاهزًا أو اكتب فرصتك. تبقى الفرص الجديدة مخفية حتى يعتمدها مكتب التدريب.',
  tCompany2t: 'راجع المتقدمين', tCompany2d: 'اقبل كل متقدم أو ارفضه. ينضم المقبولون إلى التدريب فورًا، ويمكنك التراجع خلال ثوانٍ.',
  tCompany3t: 'أنشئ رمز الحضور', tCompany3d: 'اعرض على المتدربين رمز اليوم من صفحة رمز الحضور. إعادة الإنشاء تلغي الرمز السابق.',
  tSupervisor1t: 'طلابك في لمحة', tSupervisor1d: 'اضغط على بطاقة الطالب لتشاهد الحضور والتقرير والتقييمات في مكان واحد.',
  tSupervisor2t: 'اعتمد الحضور', tSupervisor2d: 'تنتظر سجلات الحضور اعتمادك. اعتمدها واحدًا تلو الآخر أو دفعة واحدة، ويمكنك التراجع.',
  tSupervisor3t: 'راجع وقيّم', tSupervisor3d: 'اعتمد التقارير النهائية أو اطلب تعديلها، ثم ارفع الدرجة الأكاديمية من 0 إلى 100.',
  tAdmin1t: 'الاعتماد قبل النشر', tAdmin1d: 'تبقى الجهات والفرص مخفية عن الطلاب حتى تعتمدها من صفحة الاعتمادات.',
  tAdmin2t: 'إدارة الحسابات', tAdmin2d: 'أوقف الحسابات أو أعد تفعيلها، وعيّن مشرفًا أكاديميًا لكل طالب.',
  tAdmin3t: 'تابع الفصل', tAdmin3d: 'تعرض التحليلات نسب التسكين والحضور، ويُسجَّل كل إجراء في سجل التدقيق.',
  settingsTitle: 'الإعدادات', profileSection: 'الملف الشخصي', notifSection: 'الإشعارات', appearance: 'المظهر', languageLabel: 'اللغة', themeLabel: 'السمة',
  themeSystem: 'حسب الجهاز', themeLight: 'فاتح', themeDark: 'داكن', signOut: 'تسجيل الخروج', helpSection: 'المساعدة',
  pAttendance: 'تذكير الحضور', pAttendanceD: 'تذكير كل صباح تدريب بتسجيل الرمز اليومي',
  pApplications: 'تحديثات الطلبات', pApplicationsD: 'عند قبول طلب أو رفضه أو استلامه',
  pReports: 'التقارير والتقييمات', pReportsD: 'عند مراجعة تقرير أو رفع تقييم',
  pSummary: 'ملخص أسبوعي', pSummaryD: 'ملخص قصير كل خميس بعد الظهر',
  prefSaved: 'تم حفظ إعداد الإشعارات.',
  quickTemplates: 'قوالب جاهزة', templatesHelp: 'اختر قالبًا لتعبئة النموذج ثم عدّل ما تريد.', decrease: 'تقليل', increase: 'زيادة',
  studentDetails: 'تفاصيل الطالب', recentCheckins: 'آخر تسجيلات الحضور', viewDetails: 'عرض التفاصيل',
  fixErrors: 'صحّح الحقول المحددة للمتابعة.', charsLeft: 'مطلوب {n} أحرف إضافية'
});

/* Strings for company profile editing (UC-07) and printable/exportable reports (UC-17, FR-21) */
Object.assign(I18N.en, {
  companyProfileTitle: 'Company profile', companyEmail: 'Email', companyName: 'Company name', contactPhone: 'Contact phone', approvalStatus: 'Approval status',
  companyNameError: 'Enter the company name (at least 2 characters).', cityError: 'Choose the company city.',
  companyPhoneError: 'Enter a Saudi number, e.g. 0138001200 or 05XXXXXXXX.', saveCompany: 'Save changes', companySaved: 'Company profile saved.',
  navAcademicReports: 'Academic Reports', navInstReports: 'Reports',
  academicReportsTitle: 'Academic reports', academicReportsLead: 'Cohort progress and attendance for your assigned students. Print it as PDF or export it to Excel.',
  instReportsTitle: 'Institutional reports', instReportsLead: 'Placement, company participation and completion reports for the COOP office.',
  reportParams: 'Report parameters', semester: 'Semester', semester481: '481 (Fall 2026)', cohort: 'Placement', allPlacements: 'All placements',
  reportType: 'Report', rPlacement: 'Placement by major', rCompanies: 'Company participation', rCompletion: 'Completion & evaluations',
  printPdf: 'Print / Save as PDF', exportExcel: 'Export to Excel (CSV)', noReportData: 'No records match these parameters, so there is nothing to export.',
  exportedToast: 'Report exported.', generatedOn: 'Generated', generatedBy: 'by', filtersLabel: 'Filters',
  colStudent: 'Student', colMajor: 'Major', colCompany: 'Company', colPlacement: 'Placement', colSupervisor: 'Supervisor',
  colDays: 'Days logged', colApproved: 'Approved', colPending: 'Pending', colRejected: 'Rejected', colAttRate: 'Attendance %',
  colReport: 'Final report', colCompanyScore: 'Company score', colAcademicScore: 'Academic score', colStatus: 'Status',
  colStudents: 'Students', colPlaced: 'Placed', colUnplaced: 'Not placed', colPlacementRate: 'Placement %', colApplications: 'Applications', colAccepted: 'Accepted',
  colCity: 'City', colOpps: 'Opportunities', colSeats: 'Open seats', colTrainees: 'Trainees', colAvgScore: 'Avg company score', total: 'Total',
  stStudents: 'Students in report', stAvgAtt: 'Average attendance', stReportsApproved: 'Final reports approved', stAvgCompany: 'Average company score',
  stPlacementRate: 'Placement rate', stCompanies: 'Approved companies', stCompletion: 'Completion rate', inProgress: 'In progress', completedLbl: 'Completed'
});
STATUS_AR['In progress'] = 'قيد التنفيذ';
Object.assign(I18N.ar, {
  companyProfileTitle: 'ملف الشركة', companyEmail: 'البريد الإلكتروني', companyName: 'اسم الشركة', contactPhone: 'رقم التواصل', approvalStatus: 'حالة الاعتماد',
  companyNameError: 'أدخل اسم الشركة (حرفان على الأقل).', cityError: 'اختر مدينة الشركة.',
  companyPhoneError: 'أدخل رقمًا سعوديًا، مثل 0138001200 أو 05XXXXXXXX.', saveCompany: 'حفظ التغييرات', companySaved: 'تم حفظ ملف الشركة.',
  navAcademicReports: 'التقارير الأكاديمية', navInstReports: 'التقارير',
  academicReportsTitle: 'التقارير الأكاديمية', academicReportsLead: 'تقدم الدفعة والحضور لطلابك المعيّنين. اطبعه PDF أو صدّره إلى Excel.',
  instReportsTitle: 'تقارير المؤسسة', instReportsLead: 'تقارير التوظيف ومشاركة الشركات واكتمال التدريب لمكتب التدريب التعاوني.',
  reportParams: 'معايير التقرير', semester: 'الفصل', semester481: '481 (خريف 2026)', cohort: 'جهة التدريب', allPlacements: 'كل جهات التدريب',
  reportType: 'التقرير', rPlacement: 'التوظيف حسب التخصص', rCompanies: 'مشاركة الشركات', rCompletion: 'الاكتمال والتقييمات',
  printPdf: 'طباعة / حفظ PDF', exportExcel: 'تصدير إلى Excel (CSV)', noReportData: 'لا توجد سجلات تطابق هذه المعايير، فلا يوجد ما يُصدَّر.',
  exportedToast: 'تم تصدير التقرير.', generatedOn: 'أُنشئ في', generatedBy: 'بواسطة', filtersLabel: 'المعايير',
  colStudent: 'الطالب', colMajor: 'التخصص', colCompany: 'الشركة', colPlacement: 'جهة التدريب', colSupervisor: 'المشرف',
  colDays: 'أيام مسجلة', colApproved: 'معتمد', colPending: 'قيد الانتظار', colRejected: 'مرفوض', colAttRate: 'نسبة الحضور %',
  colReport: 'التقرير النهائي', colCompanyScore: 'تقييم الشركة', colAcademicScore: 'التقييم الأكاديمي', colStatus: 'الحالة',
  colStudents: 'الطلاب', colPlaced: 'تم توظيفهم', colUnplaced: 'بدون جهة', colPlacementRate: 'نسبة التوظيف %', colApplications: 'الطلبات', colAccepted: 'المقبولة',
  colCity: 'المدينة', colOpps: 'الفرص', colSeats: 'المقاعد المفتوحة', colTrainees: 'المتدربون', colAvgScore: 'متوسط تقييم الشركة', total: 'الإجمالي',
  stStudents: 'الطلاب في التقرير', stAvgAtt: 'متوسط الحضور', stReportsApproved: 'التقارير النهائية المعتمدة', stAvgCompany: 'متوسط تقييم الشركات',
  stPlacementRate: 'نسبة التوظيف', stCompanies: 'الشركات المعتمدة', stCompletion: 'نسبة الاكتمال', inProgress: 'قيد التنفيذ', completedLbl: 'مكتمل'
});



/* ---------- text of the public pages (home, sign in, register) ---------- */
var LANDING = {
  en: {
    navFeatures: 'Features', navHow: 'How It Works', navRoles: 'Roles', openApp: 'Open App',
    heroEyebrow: 'Jubail Industrial College · Cooperative Training',
    heroTitle: 'Cooperative training, from application to final evaluation',
    heroLead: 'E-COOP brings students, host companies, academic supervisors and the COOP office onto one system. Apply for placements, log attendance with a daily code, submit reports and track evaluations, in Arabic or English.',
    getStarted: 'Get Started', seeHow: 'See How It Works',
    factRoles: 'roles, one system', factLangs: 'languages, full RTL', factCode: 'digit daily code, no camera needed',
    featuresTitle: 'Everything a COOP term needs',
    featuresLead: 'Each feature maps to a requirement in the COOP analysis, so what the college asked for is what the system does.',
    f1t: 'Opportunity board', f1d: 'Companies post placements, the COOP office approves them, and students filter by major and city.',
    f2t: 'Applications', f2d: 'Students apply once per opportunity and follow each application from Submitted to Accepted.',
    f3t: 'Daily code attendance', f3d: 'Companies generate a code each morning. Students enter it on any phone, and it expires at midnight.',
    f4t: 'Final reports', f4d: 'Students upload one PDF or DOCX report. Supervisors approve it or request a revision.',
    f5t: 'Evaluations', f5d: 'Companies and supervisors score each trainee from 0 to 100, with comments the student can read.',
    f6t: 'Analytics and audit', f6d: 'The COOP office sees placement and attendance rates, and every admin action is logged.',
    howTitle: 'How a COOP term runs',
    s1t: 'Company joins', s1d: 'A company registers and the COOP office approves it before it can post.',
    s2t: 'Opportunity posted', s2d: 'The company posts a placement. It stays hidden until an admin approves it.',
    s3t: 'Student placed', s3d: 'Students apply, the company accepts, and the student joins the placement with an assigned supervisor.',
    s4t: 'Training and evaluation', s4d: 'Daily check-ins, supervisor approvals, the final report and both evaluations close the term.',
    rolesTitle: 'Built for every side of the placement',
    rStudent: 'Students', rStudentL: ['Browse and filter approved opportunities', 'Apply and track application status', 'Check in with the daily code', 'Submit the final training report'],
    rCompany: 'Companies', rCompanyL: ['Post opportunities for admin approval', 'Accept or reject applicants', 'Generate the daily attendance code', 'Evaluate each trainee'],
    rSupervisor: 'Academic supervisors', rSupervisorL: ['Monitor assigned students', 'Approve or reject attendance', 'Review final reports', 'Submit academic evaluations'],
    rAdmin: 'COOP office', rAdminL: ['Approve companies and opportunities', 'Manage and suspend accounts', 'Assign academic supervisors', 'View analytics and the audit log'],
    ctaTitle: 'Ready to start your COOP term?', ctaLead: 'Open the demo and try it from any of the four roles.', ctaBtn: 'Open E-COOP',
    footNote: 'Jubail Industrial College · Department of Business Administration',
    footDemo: 'Demo with sample records. No real student data.',
    backHome: 'Back'
  },
  ar: {
    navFeatures: 'المزايا', navHow: 'آلية العمل', navRoles: 'الأدوار', openApp: 'فتح التطبيق',
    heroEyebrow: 'كلية الجبيل الصناعية · التدريب التعاوني',
    heroTitle: 'التدريب التعاوني من التقديم حتى التقييم النهائي',
    heroLead: 'يجمع E-COOP الطلاب وجهات التدريب والمشرفين الأكاديميين ومكتب التدريب التعاوني في نظام واحد. قدّم على الفرص، وسجّل حضورك برمز يومي، وارفع التقارير، وتابع التقييمات بالعربية أو الإنجليزية.',
    getStarted: 'ابدأ الآن', seeHow: 'تعرّف على آلية العمل',
    factRoles: 'أدوار في نظام واحد', factLangs: 'لغتان مع دعم كامل للاتجاه من اليمين', factCode: 'أرقام لرمز الحضور بدون كاميرا',
    featuresTitle: 'كل ما يحتاجه فصل التدريب التعاوني',
    featuresLead: 'كل ميزة مرتبطة بمتطلب في تحليل النظام، فما طلبته الكلية هو ما يقدمه النظام.',
    f1t: 'لوحة الفرص', f1d: 'تنشر الجهات فرص التدريب، ويعتمدها مكتب التدريب، ويصفّيها الطلاب حسب التخصص والمدينة.',
    f2t: 'الطلبات', f2d: 'يقدّم الطالب مرة واحدة لكل فرصة ويتابع طلبه من الإرسال حتى القبول.',
    f3t: 'الحضور برمز يومي', f3d: 'تُنشئ الجهة رمزًا كل صباح، ويُدخله الطالب من أي جوال، وينتهي عند منتصف الليل.',
    f4t: 'التقارير النهائية', f4d: 'يرفع الطالب تقريرًا واحدًا بصيغة PDF أو DOCX، ويعتمده المشرف أو يطلب تعديله.',
    f5t: 'التقييمات', f5d: 'تقيّم الجهة والمشرف كل متدرب من 0 إلى 100 مع ملاحظات يطّلع عليها الطالب.',
    f6t: 'التحليلات والتدقيق', f6d: 'يطّلع مكتب التدريب على نسب التسكين والحضور، وتُسجَّل كل إجراءات المسؤول.',
    howTitle: 'كيف يسير فصل التدريب',
    s1t: 'انضمام الجهة', s1d: 'تسجّل الجهة ويعتمدها مكتب التدريب قبل أن تتمكن من النشر.',
    s2t: 'نشر الفرصة', s2d: 'تنشر الجهة فرصة تدريب تبقى مخفية حتى يعتمدها المسؤول.',
    s3t: 'تسكين الطالب', s3d: 'يقدّم الطلاب، وتقبلهم الجهة، وينضم الطالب إلى التدريب مع مشرف أكاديمي.',
    s4t: 'التدريب والتقييم', s4d: 'الحضور اليومي واعتماد المشرف والتقرير النهائي والتقييمان تختم الفصل.',
    rolesTitle: 'مصمم لكل أطراف التدريب',
    rStudent: 'الطلاب', rStudentL: ['تصفّح الفرص المعتمدة وتصفيتها', 'التقديم ومتابعة حالة الطلب', 'تسجيل الحضور بالرمز اليومي', 'رفع التقرير النهائي'],
    rCompany: 'جهات التدريب', rCompanyL: ['نشر الفرص لاعتمادها', 'قبول المتقدمين أو رفضهم', 'إنشاء رمز الحضور اليومي', 'تقييم كل متدرب'],
    rSupervisor: 'المشرفون الأكاديميون', rSupervisorL: ['متابعة الطلاب المعيّنين', 'اعتماد الحضور أو رفضه', 'مراجعة التقارير النهائية', 'رفع التقييمات الأكاديمية'],
    rAdmin: 'مكتب التدريب التعاوني', rAdminL: ['اعتماد الجهات والفرص', 'إدارة الحسابات وإيقافها', 'تعيين المشرفين الأكاديميين', 'الاطلاع على التحليلات وسجل التدقيق'],
    ctaTitle: 'جاهز لبدء فصل التدريب التعاوني؟', ctaLead: 'افتح النسخة التجريبية وجرّبها من أي دور من الأدوار الأربعة.', ctaBtn: 'فتح E-COOP',
    footNote: 'كلية الجبيل الصناعية · قسم إدارة الأعمال',
    footDemo: 'نسخة تجريبية ببيانات نموذجية، لا تتضمن بيانات طلاب حقيقية.',
    backHome: 'رجوع'
  }
};

/* outline icons, 24 grid, 1.5 stroke */
Object.assign(LANDING.en, {
  hEyebrow: 'GET STARTED', hTitle: 'See how cooperative training works.',
  hLead: 'Sign in with your email to follow your placement, attendance, reports and evaluations.',
  officePhone: '013 340 9000', officeEmail: 'coop.office@jic.edu.sa',
  fEmail: 'Email', fEmailPh: 'Enter your email', fPass: 'Password', fPassPh: 'Enter your password', fSubmit: 'Sign In',
  fTerms: 'By signing in, you agree to the Jubail Industrial College cooperative training policy and the PDPL personal data terms.',
  fDemo: 'Use a demo account instead', fDemoHint: 'Demo: any password works for the sample accounts, for example ahmed.almousa@jic.edu.sa.',
  eEmail: 'Enter your email, for example name@jic.edu.sa.', eNoUser: 'No E-COOP account uses this email. Check it or use a demo account.', ePass: 'Enter your password.', eSuspended: 'This account is suspended. Contact the COOP office to reactivate it.',
  footBuilt: 'Built by Business Administration students at Jubail Industrial College.', footFor: 'Cooperative Training Management System.',
  footPlatform: 'Platform', footAccounts: 'Accounts', footRights: '\u00a9 2026 E-COOP · Jubail Industrial College. All rights reserved.',
  accStudent: 'Students', accCompany: 'Companies', accSupervisor: 'Supervisors', accAdmin: 'COOP office', langSwitch: 'العربية'
});
Object.assign(LANDING.ar, {
  hEyebrow: 'ابدأ الآن', hTitle: 'تعرّف على سير التدريب التعاوني.',
  hLead: 'سجّل الدخول ببريدك الإلكتروني لمتابعة تدريبك وحضورك وتقاريرك وتقييماتك.',
  officePhone: '013 340 9000', officeEmail: 'coop.office@jic.edu.sa',
  fEmail: 'البريد الإلكتروني', fEmailPh: 'أدخل بريدك الإلكتروني', fPass: 'كلمة المرور', fPassPh: 'أدخل كلمة المرور', fSubmit: 'تسجيل الدخول',
  fTerms: 'بتسجيل الدخول فإنك توافق على سياسة التدريب التعاوني في كلية الجبيل الصناعية وشروط نظام حماية البيانات الشخصية.',
  fDemo: 'استخدم حسابًا تجريبيًا', fDemoHint: 'تجريبي: أي كلمة مرور تعمل مع الحسابات النموذجية، مثل ahmed.almousa@jic.edu.sa.',
  eEmail: 'أدخل بريدك الإلكتروني، مثل name@jic.edu.sa.', eNoUser: 'لا يوجد حساب في E-COOP بهذا البريد. تحقق منه أو استخدم حسابًا تجريبيًا.', ePass: 'أدخل كلمة المرور.', eSuspended: 'هذا الحساب موقوف. تواصل مع مكتب التدريب التعاوني لإعادة تفعيله.',
  footBuilt: 'من تطوير طلاب إدارة الأعمال في كلية الجبيل الصناعية.', footFor: 'نظام إدارة التدريب التعاوني.',
  footPlatform: 'المنصة', footAccounts: 'الحسابات', footRights: '\u00a9 2026 E-COOP · كلية الجبيل الصناعية. جميع الحقوق محفوظة.',
  accStudent: 'الطلاب', accCompany: 'جهات التدريب', accSupervisor: 'المشرفون', accAdmin: 'مكتب التدريب التعاوني', langSwitch: 'English'
});

Object.assign(LANDING.en, {
  navContact: 'Contact', home: 'Home', footContact: 'Contact', contactUs: 'Contact Us', sendFeedback: 'Send Feedback', reportProblem: 'Report a Problem',
  pFeaturesLead: 'Six tools that cover a COOP term from the first posting to the final evaluation.',
  pHowLead: 'Four stages every placement goes through, and who acts at each one.',
  pRolesLead: 'What students, companies, academic supervisors and the COOP office can each do.',
  exploreTitle: 'Explore E-COOP', learnMore: 'Learn more',
  cTitle: 'Contact the COOP office', cLead: 'Send a question, a partnership request or a problem report. The COOP office reads every message.',
  cName: 'Full name', cNamePh: 'Enter your full name', cEmail: 'Email', cEmailPh: 'Enter your email', cTopic: 'Topic', cMsg: 'Message', cMsgPh: 'Write your message',
  tGeneral: 'General question', tPartner: 'Company partnership', tProblem: 'Technical problem', tFeedback: 'Feedback',
  cSend: 'Send Message', cSentTitle: 'Message sent', cSentBody: 'Your message reached the COOP office inbox. In this demo it appears in the COOP Office account\u2019s notifications.', cAnother: 'Send another message',
  eName: 'Enter your full name.', eMsg: 'Write at least 20 characters so the office can help.', msgLeft: '{n} more characters needed'
});
Object.assign(LANDING.ar, {
  navContact: 'تواصل معنا', home: 'الرئيسية', footContact: 'تواصل', contactUs: 'تواصل معنا', sendFeedback: 'أرسل ملاحظاتك', reportProblem: 'أبلغ عن مشكلة',
  pFeaturesLead: 'ست أدوات تغطي فصل التدريب من أول فرصة منشورة حتى التقييم النهائي.',
  pHowLead: 'أربع مراحل يمر بها كل تدريب، ومن يتولى كل مرحلة.',
  pRolesLead: 'ما يستطيع الطلاب وجهات التدريب والمشرفون الأكاديميون ومكتب التدريب القيام به.',
  exploreTitle: 'تعرّف على E-COOP', learnMore: 'اعرف المزيد',
  cTitle: 'تواصل مع مكتب التدريب التعاوني', cLead: 'أرسل سؤالًا أو طلب شراكة أو بلاغًا عن مشكلة. يقرأ مكتب التدريب كل رسالة.',
  cName: 'الاسم الكامل', cNamePh: 'أدخل اسمك الكامل', cEmail: 'البريد الإلكتروني', cEmailPh: 'أدخل بريدك الإلكتروني', cTopic: 'الموضوع', cMsg: 'الرسالة', cMsgPh: 'اكتب رسالتك',
  tGeneral: 'سؤال عام', tPartner: 'شراكة مع جهة تدريب', tProblem: 'مشكلة تقنية', tFeedback: 'ملاحظات',
  cSend: 'إرسال الرسالة', cSentTitle: 'تم إرسال الرسالة', cSentBody: 'وصلت رسالتك إلى بريد مكتب التدريب. في هذه النسخة التجريبية تظهر في إشعارات حساب مكتب التدريب.', cAnother: 'إرسال رسالة أخرى',
  eName: 'أدخل اسمك الكامل.', eMsg: 'اكتب 20 حرفًا على الأقل ليتمكن المكتب من مساعدتك.', msgLeft: 'مطلوب {n} أحرف إضافية'
});

Object.assign(LANDING.en, {
  createAccount: 'Create Account', newHere: 'New to E-COOP?', haveAccount: 'Already have an account?', signInLink: 'Sign in',
  rTitle: 'Create your E\u2011COOP account', rLead: 'Students, academic supervisors and companies can register with any email. Companies post training opportunities after the COOP office approves them.',
  rType: 'I am a', rStudent: 'Student', rCompany: 'Company', rFullName: 'Full name', rCompanyName: 'Company name', rEmail: 'Email', rCollegeEmail: 'College email',
  rPhone: 'Mobile number', rMajor: 'Major', rGpa: 'GPA (out of 5)', rCity: 'City', rPass: 'Password', rPass2: 'Confirm password',
  rPassHelp: 'At least 8 characters, with a letter and a number.', rAgree: 'I agree to the cooperative training policy and the PDPL personal data terms.', rSubmit: 'Create Account',
  rCompanyNote: 'Company accounts can sign in right away. You can post opportunities once the COOP office approves your company.',
  reName: 'Enter your full name.', reCompany: 'Enter the company name.', reCollege: 'Use your college email ending in @jic.edu.sa.', reEmail: 'Enter a valid email, for example name@example.com.',
  reTaken: 'An account already uses this email. Sign in instead.', rePhone: 'Enter a Saudi mobile number starting with 05, 10 digits.', reGpa: 'GPA must be between 0 and 5.',
  rePass: 'Use at least 8 characters, with a letter and a number.', rePass2: 'The passwords don\u2019t match.', reAgree: 'Agree to the terms to create your account.',
  rePassWrong: 'The password is incorrect. Try again.', rSupervisor: 'Supervisor', rAdmin: 'Admin', rCode: 'Admin access code', rCodeHelp: '', reCode: 'The access code is incorrect. Ask the COOP office for the current code.', rAdmNote: 'Admin accounts can approve companies, manage users and see every record. Only COOP office staff should create one, using the office\u2019s access code.', rDept: 'Department', rCityPh: 'Choose a city', rCityHelp: 'All Saudi cities, grouped by region.', reCity: 'Choose the city where the company is based.', rSupNote: 'Supervisor accounts are for academic staff. The COOP office assigns students to you after you join.', rDemoNote: 'In this demo, new accounts are saved only in this browser.'
});
Object.assign(LANDING.ar, {
  createAccount: 'إنشاء حساب', newHere: 'جديد في E-COOP؟', haveAccount: 'لديك حساب؟', signInLink: 'سجّل الدخول',
  rTitle: 'أنشئ حسابك في E-COOP', rLead: 'يمكن للطلاب والمشرفين الأكاديميين والجهات التسجيل بأي بريد إلكتروني. وتنشر الجهات فرص التدريب بعد اعتمادها من مكتب التدريب التعاوني.',
  rType: 'نوع الحساب', rStudent: 'طالب', rCompany: 'جهة تدريب', rFullName: 'الاسم الكامل', rCompanyName: 'اسم الجهة', rEmail: 'البريد الإلكتروني', rCollegeEmail: 'البريد الجامعي',
  rPhone: 'رقم الجوال', rMajor: 'التخصص', rGpa: 'المعدل (من 5)', rCity: 'المدينة', rPass: 'كلمة المرور', rPass2: 'تأكيد كلمة المرور',
  rPassHelp: '8 أحرف على الأقل، تتضمن حرفًا ورقمًا.', rAgree: 'أوافق على سياسة التدريب التعاوني وشروط نظام حماية البيانات الشخصية.', rSubmit: 'إنشاء الحساب',
  rCompanyNote: 'يمكن لحساب الجهة تسجيل الدخول فورًا، ونشر الفرص بعد اعتماد مكتب التدريب للجهة.',
  reName: 'أدخل اسمك الكامل.', reCompany: 'أدخل اسم الجهة.', reCollege: 'استخدم بريدك الجامعي المنتهي بـ @jic.edu.sa.', reEmail: 'أدخل بريدًا صحيحًا، مثل name@example.com.',
  reTaken: 'هذا البريد مستخدم في حساب آخر. سجّل الدخول بدلًا من ذلك.', rePhone: 'أدخل رقم جوال سعودي يبدأ بـ 05 من 10 أرقام.', reGpa: 'يجب أن يكون المعدل بين 0 و5.',
  rePass: 'استخدم 8 أحرف على الأقل تتضمن حرفًا ورقمًا.', rePass2: 'كلمتا المرور غير متطابقتين.', reAgree: 'وافق على الشروط لإنشاء حسابك.',
  rePassWrong: 'كلمة المرور غير صحيحة. حاول مرة أخرى.', rSupervisor: 'مشرف أكاديمي', rAdmin: 'مسؤول', rCode: 'رمز صلاحية المسؤول', rCodeHelp: '', reCode: 'رمز الصلاحية غير صحيح. اطلب الرمز الحالي من مكتب التدريب التعاوني.', rAdmNote: 'يستطيع المسؤول اعتماد الجهات وإدارة المستخدمين والاطلاع على جميع السجلات. يجب أن يُنشئ هذا الحساب موظفو مكتب التدريب فقط باستخدام رمز الصلاحية.', rDept: 'القسم', rCityPh: 'اختر المدينة', rCityHelp: 'جميع مدن المملكة مرتبة حسب المنطقة.', reCity: 'اختر المدينة التي يقع فيها مقر الجهة.', rSupNote: 'حسابات المشرفين مخصصة لأعضاء هيئة التدريس، ويعيّن مكتب التدريب الطلاب لك بعد انضمامك.', rDemoNote: 'في هذه النسخة التجريبية تُحفظ الحسابات الجديدة في هذا المتصفح فقط.'
});

Object.assign(I18N.en, LANDING.en);
Object.assign(I18N.ar, LANDING.ar);

/* ---------- extra text used by the HTML pages ---------- */
Object.assign(I18N.en, {
  trainingPlaced: 'Trainees placed', openSeats: 'Open seats', codeCol: 'Code', accountsWord: 'accounts', entriesWord: 'entries',
  enterFullName: 'Enter your full name.', cpName: 'Company name', cpNameError: 'Enter the company name.',
  cpPhoneError: 'Phone must start with 0 and have 9 or 10 digits.', cpSaved: 'Company profile saved.',
  demoPasswordHint: 'Password for every demo account:', codeLocked: '5 wrong codes: check-in is blocked for 10 minutes.',
  fDemoHint: 'Demo: the sample accounts use the password Coop@2026.', nRaw: '{m}', Withdrawn: 'Withdrawn'
});
Object.assign(I18N.ar, {
  trainingPlaced: 'متدربون', openSeats: 'المقاعد المفتوحة', codeCol: 'الرمز', accountsWord: 'حسابًا', entriesWord: 'سجل',
  enterFullName: 'أدخل اسمك الكامل.', cpName: 'اسم الجهة', cpNameError: 'أدخل اسم الجهة.',
  cpPhoneError: 'يجب أن يبدأ الرقم بـ 0 ويتكون من 9 أو 10 أرقام.', cpSaved: 'تم حفظ ملف الجهة.',
  demoPasswordHint: 'كلمة المرور لكل الحسابات التجريبية:', codeLocked: '٥ رموز خاطئة: تم إيقاف تسجيل الحضور لمدة ١٠ دقائق.',
  fDemoHint: 'تجريبي: كلمة مرور الحسابات التجريبية هي Coop@2026.', nRaw: '{m}', Withdrawn: 'مسحوب'
});
Object.assign(STATUS_AR, { Withdrawn: 'مسحوب', Closed: 'مغلقة' });


/* ---------- Saudi regions and cities ---------- */
var SA_REGIONS = [
  ['Riyadh Region', 'منطقة الرياض', [['Riyadh', 'الرياض'], ['Al Kharj', 'الخرج'], ['Ad Diriyah', 'الدرعية'], ['Al Majmaah', 'المجمعة'], ['Az Zulfi', 'الزلفي'], ['Shaqra', 'شقراء'], ['Al Quwayiyah', 'القويعية'], ['Wadi Ad Dawasir', 'وادي الدواسر'], ['Al Aflaj', 'الأفلاج'], ['Afif', 'عفيف'], ['Ad Dawadmi', 'الدوادمي'], ['Hotat Bani Tamim', 'حوطة بني تميم'], ['Al Muzahmiyah', 'المزاحمية'], ['Rumah', 'رماح'], ['Thadiq', 'ثادق'], ['Huraymila', 'حريملاء'], ['Al Ghat', 'الغاط'], ['Dhurma', 'ضرما'], ['Al Hariq', 'الحريق'], ['As Sulayyil', 'السليل'], ['Marat', 'مرات']]],
  ['Makkah Region', 'منطقة مكة المكرمة', [['Makkah', 'مكة المكرمة'], ['Jeddah', 'جدة'], ['Taif', 'الطائف'], ['Rabigh', 'رابغ'], ['Al Qunfudhah', 'القنفذة'], ['Al Lith', 'الليث'], ['Al Jumum', 'الجموم'], ['Khulais', 'خليص'], ['Al Kamil', 'الكامل'], ['Turabah', 'تربة'], ['Al Khurmah', 'الخرمة'], ['Ranyah', 'رنية'], ['Al Muwayh', 'الموية'], ['Adham', 'أضم'], ['Maysan', 'ميسان'], ['Bahrah', 'بحرة'], ['King Abdullah Economic City', 'مدينة الملك عبدالله الاقتصادية']]],
  ['Madinah Region', 'منطقة المدينة المنورة', [['Madinah', 'المدينة المنورة'], ['Yanbu', 'ينبع'], ['Al Ula', 'العلا'], ['Badr', 'بدر'], ['Khaybar', 'خيبر'], ['Al Hinakiyah', 'الحناكية'], ['Mahd Adh Dhahab', 'مهد الذهب'], ['Wadi Al Fara', 'وادي الفرع']]],
  ['Eastern Province', 'المنطقة الشرقية', [['Dammam', 'الدمام'], ['Khobar', 'الخبر'], ['Dhahran', 'الظهران'], ['Jubail', 'الجبيل'], ['Al Ahsa', 'الأحساء'], ['Hofuf', 'الهفوف'], ['Al Mubarraz', 'المبرز'], ['Qatif', 'القطيف'], ['Ras Tanura', 'رأس تنورة'], ['Hafar Al Batin', 'حفر الباطن'], ['Al Khafji', 'الخفجي'], ['Abqaiq', 'بقيق'], ['An Nairyah', 'النعيرية'], ['Qaryat Al Ulya', 'قرية العليا'], ['Saihat', 'سيهات'], ['Safwa', 'صفوى'], ['Tarout', 'تاروت'], ['Ras Al Khair', 'رأس الخير'], ['Al Udayd', 'العديد']]],
  ['Qassim Region', 'منطقة القصيم', [['Buraidah', 'بريدة'], ['Unaizah', 'عنيزة'], ['Ar Rass', 'الرس'], ['Al Bukayriyah', 'البكيرية'], ['Al Badai', 'البدائع'], ['Al Mithnab', 'المذنب'], ['Riyadh Al Khabra', 'رياض الخبراء'], ['Uyun Al Jiwa', 'عيون الجواء'], ['Ash Shimasiyah', 'الشماسية'], ['Al Asyah', 'الأسياح'], ['An Nabhaniyah', 'النبهانية']]],
  ['Asir Region', 'منطقة عسير', [['Abha', 'أبها'], ['Khamis Mushait', 'خميس مشيط'], ['Bisha', 'بيشة'], ['An Namas', 'النماص'], ['Muhayil', 'محايل عسير'], ['Sarat Abidah', 'سراة عبيدة'], ['Ahad Rafidah', 'أحد رفيدة'], ['Rijal Almaa', 'رجال ألمع'], ['Tathlith', 'تثليث'], ['Dhahran Al Janub', 'ظهران الجنوب'], ['Al Majaridah', 'المجاردة'], ['Balqarn', 'بلقرن']]],
  ['Tabuk Region', 'منطقة تبوك', [['Tabuk', 'تبوك'], ['Al Wajh', 'الوجه'], ['Duba', 'ضباء'], ['Umluj', 'أملج'], ['Tayma', 'تيماء'], ['Haql', 'حقل'], ['NEOM', 'نيوم']]],
  ['Hail Region', 'منطقة حائل', [['Hail', 'حائل'], ['Baqaa', 'بقعاء'], ['Al Ghazalah', 'الغزالة'], ['Ash Shinan', 'الشنان'], ['Mawqaq', 'موقق'], ['Al Hait', 'الحائط']]],
  ['Northern Borders Region', 'منطقة الحدود الشمالية', [['Arar', 'عرعر'], ['Rafha', 'رفحاء'], ['Turaif', 'طريف'], ['Al Uwayqilah', 'العويقيلة']]],
  ['Jazan Region', 'منطقة جازان', [['Jazan', 'جازان'], ['Sabya', 'صبيا'], ['Abu Arish', 'أبو عريش'], ['Samtah', 'صامطة'], ['Ahad Al Masarihah', 'أحد المسارحة'], ['Baish', 'بيش'], ['Ad Darb', 'الدرب'], ['Farasan', 'فرسان'], ['Al Aridah', 'العارضة'], ['Ad Dayer', 'الداير']]],
  ['Najran Region', 'منطقة نجران', [['Najran', 'نجران'], ['Sharurah', 'شرورة'], ['Habuna', 'حبونا'], ['Badr Al Janub', 'بدر الجنوب'], ['Yadamah', 'يدمة'], ['Khubash', 'خباش']]],
  ['Al Bahah Region', 'منطقة الباحة', [['Al Bahah', 'الباحة'], ['Baljurashi', 'بلجرشي'], ['Al Mandaq', 'المندق'], ['Al Mikhwah', 'المخواة'], ['Al Aqiq', 'العقيق'], ['Qilwah', 'قلوة']]],
  ['Al Jouf Region', 'منطقة الجوف', [['Sakaka', 'سكاكا'], ['Dumat Al Jandal', 'دومة الجندل'], ['Al Qurayyat', 'القريات'], ['Tabarjal', 'طبرجل']]]
];
var SA_CITIES = [];
SA_REGIONS.forEach(function (r) { r[2].forEach(function (c) { SA_CITIES.push({ en: c[0], ar: c[1], region: r[0], regionAr: r[1] }); }); });
function cityLabel(en, lang) { if (lang !== 'ar') return en; for (var i = 0; i < SA_CITIES.length; i++) if (SA_CITIES[i].en === en) return SA_CITIES[i].ar; return en; }


/* ---------- chosen language and theme (saved in this browser) ---------- */
var LANG = localStorage.getItem('ecoop-lang') === 'ar' ? 'ar' : 'en';
document.documentElement.lang = LANG;
document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
if (localStorage.getItem('ecoop-theme')) document.documentElement.setAttribute('data-theme', localStorage.getItem('ecoop-theme'));
