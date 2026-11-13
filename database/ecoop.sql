-- =====================================================================================
--  E-COOP - Cooperative Training Management System (MIS 451, Jubail Industrial College)
--  ONE-FILE DATABASE SETUP: schema (22 tables, triggers, procedures, views) + demo data.
--  Import this file in phpMyAdmin (Import tab) or run it with:  mysql -u root < ecoop.sql
--  It DROPS and re-creates the database "ecoop". Works on XAMPP (MariaDB 10.4+) and MySQL 8.
-- =====================================================================================
DROP DATABASE IF EXISTS ecoop;
CREATE DATABASE ecoop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecoop;
SET time_zone = '+03:00';   -- Asia/Riyadh (data hosted in KSA, NFR-CC-01)

-- -------------------------------------------------------------------------------------
-- 1. Lookup: majors (removes the multi-valued "MajorRequirements" text -> 1NF)
-- -------------------------------------------------------------------------------------
CREATE TABLE majors (
  major_id      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  major_name    VARCHAR(100)      NOT NULL,
  major_name_ar VARCHAR(100)      NULL,
  department    VARCHAR(120)      NULL,
  CONSTRAINT pk_majors PRIMARY KEY (major_id),
  CONSTRAINT uq_majors_name UNIQUE (major_name)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- 2. USER (supertype) - authentication, RBAC role, account status, lockout (NFR-SE-05)
-- -------------------------------------------------------------------------------------
CREATE TABLE users (
  user_id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name           VARCHAR(150)  NOT NULL,
  email               VARCHAR(190)  NOT NULL,
  password_hash       VARCHAR(255)  NOT NULL,                       -- bcrypt / argon2, never plaintext (NFR-SE-01)
  phone               VARCHAR(15)   NULL,
  role                VARCHAR(20)   NOT NULL,
  account_status      ENUM('Active','Suspended') NOT NULL DEFAULT 'Active',   -- BR-02
  avatar_path         VARCHAR(255)  NULL,
  failed_login_count  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  lockout_until       DATETIME      NULL,
  last_login_at       DATETIME      NULL,
  privacy_accepted_at DATETIME      NULL,                             -- PDPL notice (D3 §3.4.2.5)
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_users PRIMARY KEY (user_id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_id_role UNIQUE (user_id, role),               -- target of the role-safe 1:1 FKs (BR-01)
  CONSTRAINT ck_users_role  CHECK (role IN ('Student','Company','Academic Supervisor','Admin')),
  CONSTRAINT ck_users_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT ck_users_phone CHECK (phone IS NULL OR phone REGEXP '^0[0-9]{8,9}$'),
  CONSTRAINT ck_users_failed CHECK (failed_login_count <= 50)
) ENGINE=InnoDB;
CREATE INDEX ix_users_role_status ON users (role, account_status);

-- -------------------------------------------------------------------------------------
-- 3. Role profiles (1:1 specialisation). The (user_id, role) composite FK guarantees that
--    a user has exactly one profile, and only in the table that matches users.role (BR-01).
-- -------------------------------------------------------------------------------------
CREATE TABLE admins (
  admin_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'Admin',
  office_name VARCHAR(120) NOT NULL DEFAULT 'COOP Office',
  CONSTRAINT pk_admins PRIMARY KEY (admin_id),
  CONSTRAINT uq_admins_user UNIQUE (user_id),
  CONSTRAINT ck_admins_role CHECK (role = 'Admin'),
  CONSTRAINT fk_admins_user FOREIGN KEY (user_id, role) REFERENCES users (user_id, role)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE academic_supervisors (
  supervisor_id    INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED      NOT NULL,
  role             VARCHAR(20)       NOT NULL DEFAULT 'Academic Supervisor',
  department       VARCHAR(120)      NOT NULL,
  max_student_load SMALLINT UNSIGNED NOT NULL DEFAULT 15,           -- load warning (UC-21)
  CONSTRAINT pk_academic_supervisors PRIMARY KEY (supervisor_id),
  CONSTRAINT uq_supervisors_user UNIQUE (user_id),
  CONSTRAINT ck_supervisors_role CHECK (role = 'Academic Supervisor'),
  CONSTRAINT ck_supervisors_load CHECK (max_student_load > 0),
  CONSTRAINT fk_supervisors_user FOREIGN KEY (user_id, role) REFERENCES users (user_id, role)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE companies (
  company_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id              INT UNSIGNED NOT NULL,
  role                 VARCHAR(20)  NOT NULL DEFAULT 'Company',
  company_name         VARCHAR(150) NOT NULL,
  cr_number            VARCHAR(20)  NULL,                            -- commercial registration (verified in UC-19)
  city                 VARCHAR(80)  NOT NULL,
  approval_status      ENUM('Pending Approval','Approved','Rejected') NOT NULL DEFAULT 'Pending Approval',
  approved_by_admin_id INT UNSIGNED NULL,
  approved_at          DATETIME     NULL,
  rejection_reason     TEXT         NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_companies PRIMARY KEY (company_id),
  CONSTRAINT uq_companies_user UNIQUE (user_id),
  CONSTRAINT uq_companies_cr UNIQUE (cr_number),
  CONSTRAINT ck_companies_role CHECK (role = 'Company'),
  CONSTRAINT ck_companies_approved CHECK (approval_status <> 'Approved' OR (approved_by_admin_id IS NOT NULL AND approved_at IS NOT NULL)),  -- BR-05
  CONSTRAINT ck_companies_rejected CHECK (approval_status <> 'Rejected' OR rejection_reason IS NOT NULL),                                  -- D3 §3.4.1.4
  CONSTRAINT fk_companies_user  FOREIGN KEY (user_id, role) REFERENCES users (user_id, role) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_companies_admin FOREIGN KEY (approved_by_admin_id) REFERENCES admins (admin_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_companies_status ON companies (approval_status);

-- students.placement_id -> training_placements is added after that table exists (section 6)
CREATE TABLE students (
  student_id             INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id                INT UNSIGNED      NOT NULL,
  role                   VARCHAR(20)       NOT NULL DEFAULT 'Student',
  university_id          VARCHAR(20)       NOT NULL,
  major_id               SMALLINT UNSIGNED NOT NULL,
  gpa                    DECIMAL(3,2)      NULL,
  cv_file_path           VARCHAR(255)      NULL,
  cv_uploaded_at         DATETIME          NULL,
  placement_id           INT UNSIGNED      NULL,                      -- current placement, NULL = not placed (BR-11)
  supervisor_id          INT UNSIGNED      NULL,                      -- exactly one supervisor once assigned (BR-12)
  supervisor_assigned_at DATETIME          NULL,                      -- who assigned is kept in AUDIT_LOG
  failed_code_attempts   TINYINT UNSIGNED  NOT NULL DEFAULT 0,        -- 5 wrong codes -> 10 min block (D3 §3.4.2.2)
  code_lockout_until     DATETIME          NULL,
  CONSTRAINT pk_students PRIMARY KEY (student_id),
  CONSTRAINT uq_students_user UNIQUE (user_id),
  CONSTRAINT uq_students_university UNIQUE (university_id),
  CONSTRAINT ck_students_role CHECK (role = 'Student'),
  CONSTRAINT ck_students_gpa  CHECK (gpa IS NULL OR gpa BETWEEN 0 AND 5),
  CONSTRAINT ck_students_cv   CHECK (cv_file_path IS NULL OR LOWER(cv_file_path) REGEXP '\\.(pdf|docx)$'),
  CONSTRAINT fk_students_user  FOREIGN KEY (user_id, role) REFERENCES users (user_id, role) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_students_major FOREIGN KEY (major_id) REFERENCES majors (major_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_students_supervisor FOREIGN KEY (supervisor_id) REFERENCES academic_supervisors (supervisor_id) ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE INDEX ix_students_supervisor ON students (supervisor_id);
CREATE INDEX ix_students_placement ON students (placement_id);

-- -------------------------------------------------------------------------------------
-- 4. COOP_OPPORTUNITY + opportunity_majors (M:N)
-- -------------------------------------------------------------------------------------
CREATE TABLE coop_opportunities (
  opportunity_id       INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  company_id           INT UNSIGNED      NOT NULL,
  approved_by_admin_id INT UNSIGNED      NULL,
  title                VARCHAR(150)      NOT NULL,
  description          TEXT              NOT NULL,
  city                 VARCHAR(80)       NOT NULL,
  capacity             SMALLINT UNSIGNED NOT NULL,
  min_gpa              DECIMAL(3,2)      NULL,                        -- minimum GPA to apply (out of 5), NULL = no minimum
  status               ENUM('Pending Approval','Approved','Rejected','Closed') NOT NULL DEFAULT 'Pending Approval',
  posted_at            DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at          DATETIME          NULL,
  rejection_reason     TEXT              NULL,
  CONSTRAINT pk_coop_opportunities PRIMARY KEY (opportunity_id),
  CONSTRAINT ck_opp_capacity CHECK (capacity > 0),                                                         -- UC-08 1b
  CONSTRAINT ck_opp_title CHECK (CHAR_LENGTH(TRIM(title)) >= 3),
  CONSTRAINT ck_opp_min_gpa CHECK (min_gpa IS NULL OR min_gpa BETWEEN 0 AND 5),
  CONSTRAINT ck_opp_approved CHECK (status NOT IN ('Approved','Closed') OR approved_by_admin_id IS NOT NULL), -- BR-07
  CONSTRAINT ck_opp_rejected CHECK (status <> 'Rejected' OR rejection_reason IS NOT NULL),
  CONSTRAINT fk_opp_company FOREIGN KEY (company_id) REFERENCES companies (company_id) ON UPDATE RESTRICT ON DELETE RESTRICT,          -- BR-06
  CONSTRAINT fk_opp_admin   FOREIGN KEY (approved_by_admin_id) REFERENCES admins (admin_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_opp_status_city ON coop_opportunities (status, city);        -- browse/filter <= 2 s (NFR-PE-04)
CREATE INDEX ix_opp_company ON coop_opportunities (company_id, status);
CREATE FULLTEXT INDEX ft_opp_search ON coop_opportunities (title, description);

CREATE TABLE opportunity_majors (
  opportunity_id INT UNSIGNED      NOT NULL,
  major_id       SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT pk_opportunity_majors PRIMARY KEY (opportunity_id, major_id),
  CONSTRAINT fk_om_opp   FOREIGN KEY (opportunity_id) REFERENCES coop_opportunities (opportunity_id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_om_major FOREIGN KEY (major_id) REFERENCES majors (major_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_om_major ON opportunity_majors (major_id);

-- -------------------------------------------------------------------------------------
-- 5. APPLICATION  (BR-08, BR-08-1, BR-09)
-- -------------------------------------------------------------------------------------
CREATE TABLE applications (
  application_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id       INT UNSIGNED NOT NULL,
  opportunity_id   INT UNSIGNED NOT NULL,
  status           ENUM('Pending','Accepted','Rejected','Withdrawn') NOT NULL DEFAULT 'Pending',  -- FR-04
  submitted_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at       DATETIME     NULL,
  rejection_reason TEXT         NULL,                                  -- UC-10 1a (optional)
  CONSTRAINT pk_applications PRIMARY KEY (application_id),
  CONSTRAINT uq_app_student_opp UNIQUE (student_id, opportunity_id),  -- BR-08: one application per opportunity
  CONSTRAINT ck_app_decided CHECK (status = 'Pending' OR decided_at IS NOT NULL),
  CONSTRAINT fk_app_student FOREIGN KEY (student_id) REFERENCES students (student_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_app_opp     FOREIGN KEY (opportunity_id) REFERENCES coop_opportunities (opportunity_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_app_opp_status ON applications (opportunity_id, status);
CREATE INDEX ix_app_student_status ON applications (student_id, status);

-- -------------------------------------------------------------------------------------
-- 6. TRAINING_PLACEMENT  (BR-10: an opportunity results in zero or one placement;
--    each placement belongs to exactly one opportunity; BR-11: 1..N students)
-- -------------------------------------------------------------------------------------
CREATE TABLE training_placements (
  placement_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  opportunity_id  INT UNSIGNED NOT NULL,
  start_date      DATE         NOT NULL,
  end_date        DATE         NOT NULL,
  report_due_date DATE         NULL,                                   -- report submission window (UC-05 2a)
  status          ENUM('Active','Completed') NOT NULL DEFAULT 'Active',
  completed_at    DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_training_placements PRIMARY KEY (placement_id),
  CONSTRAINT uq_placement_opp UNIQUE (opportunity_id),                -- BR-10
  CONSTRAINT ck_placement_dates CHECK (end_date > start_date),
  CONSTRAINT ck_placement_due CHECK (report_due_date IS NULL OR report_due_date >= start_date),
  CONSTRAINT ck_placement_completed CHECK (status <> 'Completed' OR completed_at IS NOT NULL),
  CONSTRAINT fk_placement_opp FOREIGN KEY (opportunity_id) REFERENCES coop_opportunities (opportunity_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

ALTER TABLE students
  ADD CONSTRAINT fk_students_placement FOREIGN KEY (placement_id) REFERENCES training_placements (placement_id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

-- -------------------------------------------------------------------------------------
-- 7. DAILY_CODE  (BR-13, FR-12, FR-23, NFR-SE-04)
-- -------------------------------------------------------------------------------------
CREATE TABLE daily_codes (
  daily_code_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  placement_id  INT UNSIGNED NOT NULL,
  code          CHAR(6)      NOT NULL,
  code_date     DATE         NOT NULL,
  expiry_time   TIME         NOT NULL DEFAULT '23:59:59',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  generated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_daily_codes PRIMARY KEY (daily_code_id),
  CONSTRAINT uq_code_per_day UNIQUE (placement_id, code_date),         -- one code per placement per day
  CONSTRAINT ck_code_6digits CHECK (code REGEXP '^[0-9]{6}$'),
  CONSTRAINT fk_code_placement FOREIGN KEY (placement_id) REFERENCES training_placements (placement_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_code_active ON daily_codes (is_active, code_date);

-- -------------------------------------------------------------------------------------
-- 8. ATTENDANCE_RECORD  (BR-14, BR-15, BR-16, FR-05, FR-15, UC-04, UC-14)
-- -------------------------------------------------------------------------------------
CREATE TABLE attendance_records (
  attendance_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id            INT UNSIGNED NOT NULL,
  daily_code_id         INT UNSIGNED NOT NULL,                         -- the placement comes from the code (3NF)
  check_in_time         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approval_status       ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  reviewed_by           INT UNSIGNED NULL,                             -- academic supervisor (separation of duties)
  reviewed_at           DATETIME     NULL,
  review_comment        TEXT         NULL,
  CONSTRAINT pk_attendance_records PRIMARY KEY (attendance_id),
  CONSTRAINT uq_att_student_code UNIQUE (student_id, daily_code_id),  -- BR-16
  CONSTRAINT ck_att_reviewed CHECK (approval_status = 'Pending' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  CONSTRAINT ck_att_reject_comment CHECK (approval_status <> 'Rejected' OR review_comment IS NOT NULL),   -- UC-14 2a
  CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students (student_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_att_code FOREIGN KEY (daily_code_id) REFERENCES daily_codes (daily_code_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_att_supervisor FOREIGN KEY (reviewed_by) REFERENCES academic_supervisors (supervisor_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_att_code_status ON attendance_records (daily_code_id, approval_status);
CREATE INDEX ix_att_student_time ON attendance_records (student_id, check_in_time);

-- -------------------------------------------------------------------------------------
-- 9. FINAL_REPORT  (BR-17, BR-18, FR-07, FR-16, UC-05, UC-15, NFR-CC-03)
-- -------------------------------------------------------------------------------------
CREATE TABLE final_reports (
  report_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id         INT UNSIGNED NOT NULL,
  placement_id       INT UNSIGNED NOT NULL,
  supervisor_id      INT UNSIGNED NULL,                                -- receiving / reviewing supervisor
  file_path          VARCHAR(255) NOT NULL,                            -- random name, private storage
  original_file_name VARCHAR(255) NOT NULL,
  file_type          ENUM('PDF','DOCX') NOT NULL,
  file_size_bytes    INT UNSIGNED NOT NULL,
  submitted_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  review_status      ENUM('Submitted','Request Revision','Approved') NOT NULL DEFAULT 'Submitted',
  review_comments    TEXT         NULL,
  reviewed_at        DATETIME     NULL,
  CONSTRAINT pk_final_reports PRIMARY KEY (report_id),
  CONSTRAINT uq_report_student UNIQUE (student_id),                    -- BR-18
  CONSTRAINT ck_report_size CHECK (file_size_bytes BETWEEN 1 AND 10485760),   -- 10 MB
  CONSTRAINT ck_report_reviewed CHECK (review_status = 'Submitted' OR (supervisor_id IS NOT NULL AND reviewed_at IS NOT NULL)),
  CONSTRAINT ck_report_revision CHECK (review_status <> 'Request Revision' OR review_comments IS NOT NULL),
  CONSTRAINT fk_report_student FOREIGN KEY (student_id) REFERENCES students (student_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_report_placement FOREIGN KEY (placement_id) REFERENCES training_placements (placement_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_report_supervisor FOREIGN KEY (supervisor_id) REFERENCES academic_supervisors (supervisor_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_report_supervisor_status ON final_reports (supervisor_id, review_status);

-- -------------------------------------------------------------------------------------
-- 10. EVALUATION  (BR-19, BR-20, BR-21, FR-13, FR-16, UC-12, UC-16)
-- -------------------------------------------------------------------------------------
CREATE TABLE evaluations (
  evaluation_id  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  student_id     INT UNSIGNED     NOT NULL,
  placement_id   INT UNSIGNED     NOT NULL,
  evaluator_type ENUM('Company','Academic Supervisor') NOT NULL,
  supervisor_id  INT UNSIGNED     NULL,
  score          TINYINT UNSIGNED NOT NULL,
  comments       TEXT             NOT NULL,
  evaluated_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_evaluations PRIMARY KEY (evaluation_id),
  CONSTRAINT uq_eval_once UNIQUE (student_id, placement_id, evaluator_type),   -- one company + one academic per student
  CONSTRAINT ck_eval_score CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT ck_eval_evaluator CHECK (
       (evaluator_type = 'Company'             AND supervisor_id IS NULL)        -- the company is the placement's company
    OR (evaluator_type = 'Academic Supervisor' AND supervisor_id IS NOT NULL)),
  CONSTRAINT fk_eval_student    FOREIGN KEY (student_id) REFERENCES students (student_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_eval_placement  FOREIGN KEY (placement_id) REFERENCES training_placements (placement_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_eval_supervisor FOREIGN KEY (supervisor_id) REFERENCES academic_supervisors (supervisor_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_eval_placement ON evaluations (placement_id, evaluator_type);

-- -------------------------------------------------------------------------------------
-- 11. NOTIFICATION + preferences  (BR-03, FR-26)
-- -------------------------------------------------------------------------------------
CREATE TABLE notifications (
  notification_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED    NOT NULL,
  notification_type VARCHAR(40)     NOT NULL,                          -- e.g. APP_ACCEPTED, ATT_APPROVED, REPORT_REVISION
  message           VARCHAR(500)    NOT NULL,
  entity_type       VARCHAR(40)     NULL,
  entity_id         BIGINT UNSIGNED NULL,
  is_read           BOOLEAN         NOT NULL DEFAULT FALSE,
  email_status      ENUM('Not Sent','Queued','Sent','Failed') NOT NULL DEFAULT 'Queued',   -- retry failed emails
  sent_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at           DATETIME        NULL,
  CONSTRAINT pk_notifications PRIMARY KEY (notification_id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX ix_notif_user_unread ON notifications (user_id, is_read, sent_at);
CREATE INDEX ix_notif_email ON notifications (email_status);

CREATE TABLE notification_preferences (
  user_id    INT UNSIGNED NOT NULL,
  pref_key   ENUM('attendance','applications','reports','summary') NOT NULL,
  is_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_notification_preferences PRIMARY KEY (user_id, pref_key),
  CONSTRAINT fk_pref_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- 12. AUDIT_LOG - append-only (BR-04, FR-22, NFR-SE-06)
-- -------------------------------------------------------------------------------------
CREATE TABLE audit_logs (
  log_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NULL,                                    -- NULL for failed logins with unknown e-mail
  action      VARCHAR(120)    NOT NULL,                                -- LOGIN_FAILED, ACCOUNT_SUSPENDED, REPORT_EXPORTED ...
  entity_type VARCHAR(40)     NULL,
  entity_id   BIGINT UNSIGNED NULL,
  details     JSON            NULL,
  ip_address  VARCHAR(45)     NULL,                                    -- IPv4 / IPv6
  user_agent  VARCHAR(255)    NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pk_audit_logs PRIMARY KEY (log_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX ix_audit_time ON audit_logs (created_at);
CREATE INDEX ix_audit_user_time ON audit_logs (user_id, created_at);
CREATE INDEX ix_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX ix_audit_action ON audit_logs (action, created_at);

-- -------------------------------------------------------------------------------------
-- 13. Supporting security / landing-page tables
-- -------------------------------------------------------------------------------------
CREATE TABLE password_reset_tokens (                                   -- single-use link, 30 min (D3 §3.4.1.1)
  token_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  token_hash CHAR(64)     NOT NULL,                                    -- SHA-256 of the e-mailed token
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME     NULL,
  CONSTRAINT pk_password_reset_tokens PRIMARY KEY (token_id),
  CONSTRAINT uq_reset_token UNIQUE (token_hash),
  CONSTRAINT ck_reset_expiry CHECK (expires_at > created_at),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE contact_messages (                                        -- landing page "Contact the COOP office"
  contact_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(150) NOT NULL,
  email       VARCHAR(190) NOT NULL,
  topic       ENUM('General','Student','Company','Supervisor','Technical') NOT NULL DEFAULT 'General',
  message     TEXT         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  handled_by  INT UNSIGNED NULL,
  handled_at  DATETIME     NULL,
  CONSTRAINT pk_contact_messages PRIMARY KEY (contact_id),
  CONSTRAINT ck_contact_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT fk_contact_admin FOREIGN KEY (handled_by) REFERENCES admins (admin_id) ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------------------
-- 14. Chat: conversations, their members and the messages
-- -------------------------------------------------------------------------------------
CREATE TABLE conversations (
  conversation_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kind            ENUM('Direct','Group') NOT NULL DEFAULT 'Direct',    -- Direct = two users, Group = a placement group
  title           VARCHAR(150) NULL,                                   -- only groups have a title
  created_by      INT UNSIGNED NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_conversations PRIMARY KEY (conversation_id),
  CONSTRAINT ck_conv_title CHECK (kind = 'Direct' OR title IS NOT NULL),
  CONSTRAINT fk_conv_creator FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE conversation_members (                                    -- M:N between conversations and users
  conversation_id INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED NOT NULL,
  joined_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_read_at    DATETIME     NULL,                                   -- messages after this time are unread
  CONSTRAINT pk_conversation_members PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT fk_cm_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE messages (
  message_id      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  conversation_id INT UNSIGNED  NOT NULL,
  sender_id       INT UNSIGNED  NOT NULL,
  body            VARCHAR(1000) NOT NULL,
  sent_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_messages PRIMARY KEY (message_id),
  CONSTRAINT ck_msg_body CHECK (CHAR_LENGTH(TRIM(body)) >= 1),
  -- the sender must be a member of the conversation
  CONSTRAINT fk_msg_member FOREIGN KEY (conversation_id, sender_id) REFERENCES conversation_members (conversation_id, user_id) ON UPDATE RESTRICT ON DELETE CASCADE,
  INDEX ix_msg_conversation (conversation_id, sent_at)
) ENGINE=InnoDB;

-- =====================================================================================
--  TRIGGERS - rules that span more than one row/table
-- =====================================================================================
DELIMITER $$

-- BR-04 / NFR-SE-06: audit log is append-only
CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON audit_logs FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'AUDIT_LOG is append-only: updates are not allowed';
END$$
CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON audit_logs FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'AUDIT_LOG is append-only: deletes are not allowed';
END$$

-- D3 §3.4.3.1: students register with the institutional e-mail domain
CREATE TRIGGER trg_student_email_domain BEFORE INSERT ON students FOR EACH ROW
BEGIN
  IF (SELECT LOWER(email) FROM users WHERE user_id = NEW.user_id) NOT LIKE '%@jic.edu.sa' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Students must use an @jic.edu.sa e-mail address';
  END IF;
END$$

-- BR-05: only an approved company can post opportunities
CREATE TRIGGER trg_opp_company_approved BEFORE INSERT ON coop_opportunities FOR EACH ROW
BEGIN
  IF (SELECT approval_status FROM companies WHERE company_id = NEW.company_id) <> 'Approved' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BR-05: the company must be approved before posting opportunities';
  END IF;
END$$

-- UC-03: apply only to approved opportunities, only without an active placement, and only with the required GPA
CREATE TRIGGER trg_app_eligibility BEFORE INSERT ON applications FOR EACH ROW
BEGIN
  DECLARE v_min DECIMAL(3,2); DECLARE v_gpa DECIMAL(3,2);
  IF (SELECT status FROM coop_opportunities WHERE opportunity_id = NEW.opportunity_id) <> 'Approved' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BR-07: students can only apply to approved opportunities';
  END IF;
  IF (SELECT placement_id FROM students WHERE student_id = NEW.student_id) IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'UC-03: a student with an active placement cannot apply';
  END IF;
  SELECT min_gpa INTO v_min FROM coop_opportunities WHERE opportunity_id = NEW.opportunity_id;
  SELECT gpa INTO v_gpa FROM students WHERE student_id = NEW.student_id;
  IF v_min IS NOT NULL AND (v_gpa IS NULL OR v_gpa < v_min) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The student GPA is below the minimum GPA of this opportunity';
  END IF;
END$$

-- BR-14 / BR-15 / UC-04: the code must be active, for the check-in date, unexpired, and for the student's own placement
CREATE TRIGGER trg_att_validate BEFORE INSERT ON attendance_records FOR EACH ROW
BEGIN
  DECLARE v_active BOOLEAN; DECLARE v_date DATE; DECLARE v_exp TIME; DECLARE v_code_pl INT UNSIGNED; DECLARE v_pl INT UNSIGNED;
  SELECT is_active, code_date, expiry_time, placement_id INTO v_active, v_date, v_exp, v_code_pl FROM daily_codes WHERE daily_code_id = NEW.daily_code_id;
  SELECT placement_id INTO v_pl FROM students WHERE student_id = NEW.student_id;
  IF v_pl IS NULL OR v_pl <> v_code_pl THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BR-15: this code belongs to another placement';
  END IF;
  IF NOT v_active OR v_date <> DATE(NEW.check_in_time) OR TIME(NEW.check_in_time) > v_exp THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'BR-14: the daily code is expired or not valid for this date';
  END IF;
END$$

-- UC-16 1a / preconditions: academic evaluation only after the placement is completed and the report is approved
CREATE TRIGGER trg_eval_academic_precondition BEFORE INSERT ON evaluations FOR EACH ROW
BEGIN
  IF NEW.evaluator_type = 'Academic Supervisor' THEN
    IF (SELECT status FROM training_placements WHERE placement_id = NEW.placement_id) <> 'Completed'
       OR NOT EXISTS (SELECT 1 FROM final_reports WHERE student_id = NEW.student_id AND review_status = 'Approved') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'UC-16: placement must be completed and the final report approved first';
    END IF;
  END IF;
END$$

-- UC-05 2a: final report only inside the submission window
CREATE TRIGGER trg_report_window BEFORE INSERT ON final_reports FOR EACH ROW
BEGIN
  DECLARE v_due DATE;
  SELECT report_due_date INTO v_due FROM training_placements WHERE placement_id = NEW.placement_id;
  IF v_due IS NOT NULL AND DATE(NEW.submitted_at) > v_due THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'UC-05: the report submission window is closed';
  END IF;
END$$

-- D3 §3.4.4: only valid status transitions
CREATE TRIGGER trg_app_transition BEFORE UPDATE ON applications FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status AND OLD.status <> 'Pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application status can only change from Pending';
  END IF;
END$$
CREATE TRIGGER trg_opp_transition BEFORE UPDATE ON coop_opportunities FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status AND NOT (
       (OLD.status = 'Pending Approval' AND NEW.status IN ('Approved','Rejected'))
    OR (OLD.status = 'Approved' AND NEW.status = 'Closed')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid opportunity status transition';
  END IF;
END$$
CREATE TRIGGER trg_att_transition BEFORE UPDATE ON attendance_records FOR EACH ROW
BEGIN
  IF OLD.approval_status <> NEW.approval_status AND OLD.approval_status <> 'Pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Attendance status can only change from Pending';
  END IF;
END$$
CREATE TRIGGER trg_placement_transition BEFORE UPDATE ON training_placements FOR EACH ROW
BEGIN
  IF OLD.status = 'Completed' AND NEW.status <> 'Completed' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A completed placement cannot be re-opened';
  END IF;
END$$

-- =====================================================================================
--  STORED PROCEDURES - multi-step operations in one transaction (D3 §3.4.4)
-- =====================================================================================

-- UC-11: return today's code for a placement, or store the new one (generated by PHP random_int, a CSPRNG)
CREATE PROCEDURE sp_get_or_create_daily_code(IN p_placement_id INT UNSIGNED, IN p_company_id INT UNSIGNED, IN p_new_code CHAR(6), OUT p_code CHAR(6))
BEGIN
  DECLARE v_owner INT UNSIGNED;
  SELECT o.company_id INTO v_owner FROM training_placements p JOIN coop_opportunities o ON o.opportunity_id = p.opportunity_id
   WHERE p.placement_id = p_placement_id AND p.status = 'Active';
  IF v_owner IS NULL OR v_owner <> p_company_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Placement is not active or does not belong to this company';
  END IF;
  SET p_code = NULL;
  SELECT code INTO p_code FROM daily_codes WHERE placement_id = p_placement_id AND code_date = CURDATE();
  IF p_code IS NULL THEN
    SET p_code = p_new_code;
    INSERT INTO daily_codes (placement_id, code, code_date) VALUES (p_placement_id, p_code, CURDATE());
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      SELECT c.user_id, 'DAILY_CODE_GENERATED', 'TRAINING_PLACEMENT', p_placement_id FROM companies c WHERE c.company_id = p_company_id;
  END IF;
END$$

-- UC-10: accept an applicant -> capacity check under row lock, create/link placement,
-- withdraw the student's other pending applications, notify, audit. All or nothing.
CREATE PROCEDURE sp_accept_application(IN p_application_id INT UNSIGNED, IN p_start DATE, IN p_end DATE)
BEGIN
  DECLARE v_student INT UNSIGNED; DECLARE v_opp INT UNSIGNED; DECLARE v_status VARCHAR(20);
  DECLARE v_capacity INT; DECLARE v_taken INT; DECLARE v_placement INT UNSIGNED;
  DECLARE v_student_user INT UNSIGNED; DECLARE v_company_user INT UNSIGNED; DECLARE v_title VARCHAR(150);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT a.student_id, a.opportunity_id, a.status INTO v_student, v_opp, v_status
    FROM applications a WHERE a.application_id = p_application_id FOR UPDATE;
  IF v_status IS NULL OR v_status <> 'Pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only pending applications can be accepted';
  END IF;

  SELECT o.capacity, o.title, c.user_id INTO v_capacity, v_title, v_company_user
    FROM coop_opportunities o JOIN companies c ON c.company_id = o.company_id
   WHERE o.opportunity_id = v_opp FOR UPDATE;                         -- lock: no over-booking (D3 §3.4.4)
  SELECT COUNT(*) INTO v_taken FROM applications WHERE opportunity_id = v_opp AND status = 'Accepted';
  IF v_taken >= v_capacity THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'UC-10 2a: opportunity capacity is full';
  END IF;

  SELECT placement_id INTO v_placement FROM training_placements WHERE opportunity_id = v_opp;
  IF v_placement IS NULL THEN
    INSERT INTO training_placements (opportunity_id, start_date, end_date) VALUES (v_opp, p_start, p_end);
    SET v_placement = LAST_INSERT_ID();
  END IF;

  UPDATE applications SET status = 'Accepted', decided_at = NOW() WHERE application_id = p_application_id;
  UPDATE applications SET status = 'Withdrawn', decided_at = NOW()
   WHERE student_id = v_student AND status = 'Pending' AND application_id <> p_application_id;   -- UC-10 2b
  UPDATE students SET placement_id = v_placement WHERE student_id = v_student;

  SELECT user_id INTO v_student_user FROM students WHERE student_id = v_student;
  INSERT INTO notifications (user_id, notification_type, message, entity_type, entity_id)
    VALUES (v_student_user, 'APP_ACCEPTED', CONCAT('Your application for ', v_title, ' was accepted.'), 'APPLICATION', p_application_id);
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
    VALUES (v_company_user, 'APPLICATION_ACCEPTED', 'APPLICATION', p_application_id);
  COMMIT;
END$$

DELIMITER ;

-- =====================================================================================
--  SCHEDULED EVENT - deactivate all daily codes at midnight (UC-11 2a, NFR-SE-04)
--  Requires: SET GLOBAL event_scheduler = ON;
-- =====================================================================================
CREATE EVENT ev_deactivate_daily_codes
  ON SCHEDULE EVERY 1 DAY STARTS (CURRENT_DATE + INTERVAL 1 DAY)
  DO UPDATE daily_codes SET is_active = FALSE WHERE is_active = TRUE AND code_date < CURRENT_DATE;

-- =====================================================================================
--  REPORTING VIEWS - feed the supervisor (UC-17, FR-17) and admin (UC-22, FR-21) reports
-- =====================================================================================
CREATE VIEW v_student_progress AS
SELECT s.student_id, u.full_name AS student_name, m.major_name, s.supervisor_id,
       s.placement_id, c.company_name, o.title AS opportunity_title,
       COALESCE(att.days_approved, 0) AS days_approved,
       COALESCE(att.days_pending, 0)  AS days_pending,
       COALESCE(att.days_rejected, 0) AS days_rejected,
       fr.review_status AS final_report_status,
       ev.company_score, ev.academic_score
FROM students s
JOIN users u  ON u.user_id = s.user_id
JOIN majors m ON m.major_id = s.major_id
LEFT JOIN training_placements p ON p.placement_id = s.placement_id
LEFT JOIN coop_opportunities o  ON o.opportunity_id = p.opportunity_id
LEFT JOIN companies c           ON c.company_id = o.company_id
LEFT JOIN final_reports fr      ON fr.student_id = s.student_id
LEFT JOIN (SELECT student_id,
                  SUM(approval_status = 'Approved') AS days_approved,
                  SUM(approval_status = 'Pending')  AS days_pending,
                  SUM(approval_status = 'Rejected') AS days_rejected
             FROM attendance_records GROUP BY student_id) att ON att.student_id = s.student_id
LEFT JOIN (SELECT student_id,
                  MAX(CASE WHEN evaluator_type = 'Company' THEN score END)             AS company_score,
                  MAX(CASE WHEN evaluator_type = 'Academic Supervisor' THEN score END) AS academic_score
             FROM evaluations GROUP BY student_id) ev ON ev.student_id = s.student_id;

CREATE VIEW v_placement_by_major AS
SELECT m.major_name,
       COUNT(s.student_id) AS students,
       SUM(s.placement_id IS NOT NULL) AS placed,
       ROUND(100 * SUM(s.placement_id IS NOT NULL) / NULLIF(COUNT(s.student_id), 0)) AS placement_rate_pct
FROM majors m
JOIN students s ON s.major_id = m.major_id
JOIN users u ON u.user_id = s.user_id AND u.account_status = 'Active'
GROUP BY m.major_name;

CREATE VIEW v_company_participation AS
SELECT c.company_id, c.company_name, c.city, c.approval_status,
       (SELECT COUNT(*) FROM coop_opportunities o WHERE o.company_id = c.company_id) AS opportunities,
       (SELECT COALESCE(SUM(o.capacity), 0) FROM coop_opportunities o WHERE o.company_id = c.company_id AND o.status = 'Approved') AS open_seats,
       (SELECT COUNT(*) FROM applications ap JOIN coop_opportunities o ON o.opportunity_id = ap.opportunity_id WHERE o.company_id = c.company_id) AS applications,
       (SELECT COUNT(*) FROM applications ap JOIN coop_opportunities o ON o.opportunity_id = ap.opportunity_id WHERE o.company_id = c.company_id AND ap.status = 'Accepted') AS accepted,
       (SELECT COUNT(*) FROM students s JOIN training_placements p ON p.placement_id = s.placement_id
          JOIN coop_opportunities o ON o.opportunity_id = p.opportunity_id WHERE o.company_id = c.company_id) AS trainees
FROM companies c;

CREATE VIEW v_supervisor_load AS                                       -- UC-21 1a load warning
SELECT sp.supervisor_id, u.full_name, sp.department, sp.max_student_load,
       COUNT(s.student_id) AS assigned_students,
       COUNT(s.student_id) > sp.max_student_load AS over_capacity
FROM academic_supervisors sp
JOIN users u ON u.user_id = sp.user_id
LEFT JOIN students s ON s.supervisor_id = sp.supervisor_id
GROUP BY sp.supervisor_id, u.full_name, sp.department, sp.max_student_load;

-- =====================================================================================
--  REFERENCE DATA
-- =====================================================================================
INSERT INTO majors (major_name, major_name_ar, department) VALUES
 ('Business Administration', 'إدارة الأعمال', 'Department of Business Administration'),
 ('Chemical Engineering', 'الهندسة الكيميائية', 'Chemical Engineering Technology'),
 ('Industrial Engineering', 'الهندسة الصناعية', 'Industrial Engineering Technology'),
 ('Mechanical Engineering', 'الهندسة الميكانيكية', 'Mechanical Engineering Technology'),
 ('Electrical Engineering', 'الهندسة الكهربائية', 'Electrical Engineering Technology'),
 ('Computer Science', 'علوم الحاسب', 'Computer Science'),
 ('Chemistry', 'الكيمياء', 'Chemistry');



-- =====================================================================================
--  DEMO DATA - the same people, companies and records as the website demo.
--  All demo accounts use the password  Coop@2026  (bcrypt hash below).
--  Dates are moved forward by whole weeks so the demo data ends close to today.
-- =====================================================================================
SET @off = 7 * FLOOR(DATEDIFF(CURDATE(), '2026-09-30') / 7);
SET @pw  = '$2y$10$bTvOEoutgIiOt7aZywNq/uNLGhdg9L01JFzRDeXzi8UgDL5vgZuXm';

INSERT INTO users (user_id, full_name, email, password_hash, phone, role, account_status, privacy_accepted_at, created_at) VALUES
 (1, 'Ahmed Abdulmohsen Almousa', 'ahmed.almousa@jic.edu.sa', @pw, '0551234567', 'Student', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (2, 'Anas Ahmed Alamri', 'anas.alamri@jic.edu.sa', @pw, '0559876543', 'Student', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (3, 'Omar Abdulaziz Alghamdi', 'omar.alghamdi@jic.edu.sa', @pw, '0543219876', 'Student', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (4, 'Hamad Ali Alghubari', 'hamad.alghubari@jic.edu.sa', @pw, '0567788990', 'Student', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (5, 'Abdullah Al-Ghamdi', 'abdullah.alghamdi@jic.edu.sa', @pw, '0501122334', 'Student', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (6, 'Yazeed Mubarak Alqahtani', 'yazeed.alqahtani@jic.edu.sa', @pw, '0534455667', 'Student', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (7, 'Hind Al-Zahrani', 'hind.alzahrani@jic.edu.sa', @pw, '0578899001', 'Student', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (8, 'Turki Al-Anazi', 'turki.alanazi@jic.edu.sa', @pw, '0512233445', 'Student', 'Suspended', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (9, 'Eastern Logistics Co.', 'coop@easternlogistics.sa', @pw, '0138001200', 'Company', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (10, 'Gulf Petrochemical Co.', 'training@gulfpetrochem.sa', @pw, '0133401100', 'Company', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (11, 'Al-Bahar Industrial Services', 'hr@albahar-is.sa', @pw, '0133620044', 'Company', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (12, 'Khobar Digital Solutions', 'careers@khobardigital.sa', @pw, '0138995500', 'Company', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (13, 'Abdullah Rashed Alrumi', 'abdullah.alrumi@jic.edu.sa', @pw, '0551002003', 'Academic Supervisor', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (14, 'Dr. Mona Al-Ghamdi', 'm.alghamdi@jic.edu.sa', @pw, '0552003004', 'Academic Supervisor', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY)),
 (15, 'COOP Office', 'coop.office@jic.edu.sa', @pw, '0133409000', 'Admin', 'Active', DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY), DATE_ADD('2026-08-01 08:00', INTERVAL @off DAY));
INSERT INTO admins (admin_id, user_id, office_name) VALUES (1, 15, 'COOP Office - Jubail Industrial College');
INSERT INTO academic_supervisors (supervisor_id, user_id, department, max_student_load) VALUES
 (1, 13, 'Department of Business Administration', 15),
 (2, 14, 'Industrial Engineering Technology', 12);
INSERT INTO companies (company_id, user_id, company_name, cr_number, city, approval_status, approved_by_admin_id, approved_at, created_at) VALUES
 (1, 10, 'Gulf Petrochemical Co.', '2055001001', 'Jubail', 'Approved', 1, DATE_ADD('2026-08-10 09:12', INTERVAL @off DAY), DATE_ADD('2026-08-05 10:00', INTERVAL @off DAY)),
 (2, 9, 'Eastern Logistics Co.', '2050002002', 'Dammam', 'Approved', 1, DATE_ADD('2026-08-10 09:12', INTERVAL @off DAY), DATE_ADD('2026-08-05 10:00', INTERVAL @off DAY)),
 (3, 11, 'Al-Bahar Industrial Services', '2055003003', 'Jubail', 'Pending Approval', NULL, NULL, DATE_ADD('2026-08-05 10:00', INTERVAL @off DAY)),
 (4, 12, 'Khobar Digital Solutions', '2051004004', 'Khobar', 'Pending Approval', NULL, NULL, DATE_ADD('2026-08-05 10:00', INTERVAL @off DAY));
INSERT INTO students (student_id, user_id, university_id, major_id, gpa, cv_file_path, cv_uploaded_at, supervisor_id, supervisor_assigned_at) VALUES
 (1, 1, '431900499', 1, 4.21, 'cv/Ahmed_Almousa_CV.pdf', DATE_ADD('2026-08-15 12:00', INTERVAL @off DAY), 1, DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY)),
 (2, 2, '431900446', 1, 4.62, 'cv/Anas_Alamri_CV.pdf', DATE_ADD('2026-08-15 12:00', INTERVAL @off DAY), 1, DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY)),
 (3, 3, '441100723', 1, 3.78, 'cv/Omar_Alghamdi_CV.docx', DATE_ADD('2026-08-15 12:00', INTERVAL @off DAY), 1, DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY)),
 (4, 4, '441100369', 2, 4.05, 'cv/Hamad_Alghubari_CV.pdf', DATE_ADD('2026-08-15 12:00', INTERVAL @off DAY), 1, DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY)),
 (5, 5, '441100555', 3, 3.64, 'cv/Abdullah_CV.pdf', DATE_ADD('2026-08-15 12:00', INTERVAL @off DAY), 2, DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY)),
 (6, 6, '431901674', 1, 4.40, 'cv/Yazeed_Alqahtani_CV.pdf', DATE_ADD('2026-08-15 12:00', INTERVAL @off DAY), NULL, NULL),
 (7, 7, '441100777', 1, 3.92, 'cv/Hind_CV.pdf', DATE_ADD('2026-08-15 12:00', INTERVAL @off DAY), 2, DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY)),
 (8, 8, '441100888', 4, 3.10, NULL, NULL, 2, DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY));
INSERT INTO coop_opportunities (opportunity_id, company_id, approved_by_admin_id, title, description, city, capacity, min_gpa, status, posted_at, approved_at) VALUES
 (1, 1, 1, 'Process Engineering Trainee', 'Support the operations team with process monitoring, shift logs and daily production reports.', 'Jubail', 4, 3.50, 'Approved', DATE_ADD('2026-08-18 09:00', INTERVAL @off DAY), DATE_ADD('2026-08-18 15:00', INTERVAL @off DAY)),
 (2, 2, 1, 'Supply Chain Analyst Trainee', 'Track inbound shipments, reconcile warehouse stock counts and prepare weekly KPI summaries.', 'Dammam', 3, 3.50, 'Approved', DATE_ADD('2026-08-12 09:00', INTERVAL @off DAY), DATE_ADD('2026-08-12 15:00', INTERVAL @off DAY)),
 (3, 1, 1, 'Maintenance Planning Trainee', 'Schedule preventive maintenance work orders and follow up spare-part requests with stores.', 'Jubail', 3, 3.00, 'Approved', DATE_ADD('2026-09-02 09:00', INTERVAL @off DAY), DATE_ADD('2026-09-02 15:00', INTERVAL @off DAY)),
 (4, 2, 1, 'HR Operations Trainee', 'Help run onboarding, update employee records and prepare attendance reports for payroll.', 'Dammam', 2, NULL, 'Approved', DATE_ADD('2026-09-14 09:00', INTERVAL @off DAY), DATE_ADD('2026-09-14 15:00', INTERVAL @off DAY)),
 (5, 1, NULL, 'Quality Control Lab Trainee', 'Run routine sample tests, record results in the lab system and flag out-of-spec batches.', 'Jubail', 2, 3.75, 'Pending Approval', DATE_ADD('2026-09-27 09:00', INTERVAL @off DAY), NULL),
 (6, 2, NULL, 'Customs and Trade Compliance Trainee', 'Prepare import documentation, check HS codes and track customs clearance status.', 'Dammam', 1, NULL, 'Pending Approval', DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY), NULL),
 (7, 2, 1, 'Fleet Scheduling Trainee', 'Plan daily delivery routes and monitor driver schedules against service-level targets.', 'Khobar', 2, 3.50, 'Approved', DATE_ADD('2026-09-20 09:00', INTERVAL @off DAY), DATE_ADD('2026-09-20 15:00', INTERVAL @off DAY)),
 (8, 2, 1, 'Procurement Analyst Trainee', 'Compare supplier quotations, prepare purchase orders and report monthly spending to the procurement manager.', 'Dammam', 2, 4.50, 'Approved', DATE_ADD('2026-09-25 09:00', INTERVAL @off DAY), DATE_ADD('2026-09-25 15:00', INTERVAL @off DAY));
INSERT INTO opportunity_majors (opportunity_id, major_id) VALUES (1, 2), (1, 3), (2, 1), (3, 4), (4, 1), (5, 7), (5, 2), (6, 1), (7, 1), (7, 3), (8, 1);
-- applications go in before placements: the eligibility trigger only lets unplaced students apply
INSERT INTO applications (application_id, student_id, opportunity_id, status, submitted_at, decided_at, rejection_reason) VALUES
 (1, 1, 2, 'Accepted', DATE_ADD('2026-08-20 10:00', INTERVAL @off DAY), DATE_ADD('2026-08-24 11:00', INTERVAL @off DAY), NULL),
 (2, 2, 2, 'Accepted', DATE_ADD('2026-08-19 10:00', INTERVAL @off DAY), DATE_ADD('2026-08-23 11:00', INTERVAL @off DAY), NULL),
 (3, 3, 2, 'Accepted', DATE_ADD('2026-08-22 10:00', INTERVAL @off DAY), DATE_ADD('2026-08-26 11:00', INTERVAL @off DAY), NULL),
 (4, 1, 1, 'Rejected', DATE_ADD('2026-08-19 10:00', INTERVAL @off DAY), DATE_ADD('2026-08-23 11:00', INTERVAL @off DAY), 'The opportunity requirements did not match this application.'),
 (5, 4, 1, 'Accepted', DATE_ADD('2026-08-21 10:00', INTERVAL @off DAY), DATE_ADD('2026-08-25 11:00', INTERVAL @off DAY), NULL),
 (6, 5, 1, 'Accepted', DATE_ADD('2026-08-24 10:00', INTERVAL @off DAY), DATE_ADD('2026-08-28 11:00', INTERVAL @off DAY), NULL),
 (7, 7, 4, 'Pending', DATE_ADD('2026-09-22 10:00', INTERVAL @off DAY), NULL, NULL),
 (8, 7, 7, 'Pending', DATE_ADD('2026-09-24 10:00', INTERVAL @off DAY), NULL, NULL),
 (9, 8, 4, 'Rejected', DATE_ADD('2026-09-16 10:00', INTERVAL @off DAY), DATE_ADD('2026-09-20 11:00', INTERVAL @off DAY), 'The opportunity requirements did not match this application.');
INSERT INTO training_placements (placement_id, opportunity_id, start_date, end_date, report_due_date, status, created_at) VALUES
 (1, 2, DATE_ADD('2026-09-06', INTERVAL @off DAY), DATE_ADD('2026-12-24', INTERVAL @off DAY), DATE_ADD('2026-12-31', INTERVAL @off DAY), 'Active', DATE_ADD('2026-08-26 09:00', INTERVAL @off DAY)),
 (2, 1, DATE_ADD('2026-09-06', INTERVAL @off DAY), DATE_ADD('2026-12-24', INTERVAL @off DAY), DATE_ADD('2026-12-31', INTERVAL @off DAY), 'Active', DATE_ADD('2026-08-26 09:00', INTERVAL @off DAY));
UPDATE students SET placement_id = 1 WHERE student_id = 1;
UPDATE students SET placement_id = 1 WHERE student_id = 2;
UPDATE students SET placement_id = 1 WHERE student_id = 3;
UPDATE students SET placement_id = 2 WHERE student_id = 4;
UPDATE students SET placement_id = 2 WHERE student_id = 5;
-- every code starts active so the attendance history passes the check-in trigger; old codes are closed right after
INSERT INTO daily_codes (daily_code_id, placement_id, code, code_date, is_active, generated_at) VALUES
 (1, 1, '107364', DATE_ADD('2026-09-29', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-29 06:30', INTERVAL @off DAY)),
 (2, 1, '482915', DATE_ADD('2026-09-30', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-30 06:30', INTERVAL @off DAY)),
 (3, 2, '730258', DATE_ADD('2026-09-30', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-30 06:30', INTERVAL @off DAY)),
 (4, 1, '699043', DATE_ADD('2026-09-06', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-06 06:30', INTERVAL @off DAY)),
 (5, 1, '612688', DATE_ADD('2026-09-07', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-07 06:30', INTERVAL @off DAY)),
 (6, 1, '987278', DATE_ADD('2026-09-08', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-08 06:30', INTERVAL @off DAY)),
 (7, 1, '525029', DATE_ADD('2026-09-09', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-09 06:30', INTERVAL @off DAY)),
 (8, 1, '818368', DATE_ADD('2026-09-10', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-10 06:30', INTERVAL @off DAY)),
 (9, 1, '931543', DATE_ADD('2026-09-13', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-13 06:30', INTERVAL @off DAY)),
 (10, 1, '294237', DATE_ADD('2026-09-14', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-14 06:30', INTERVAL @off DAY)),
 (11, 1, '936329', DATE_ADD('2026-09-16', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-16 06:30', INTERVAL @off DAY)),
 (12, 1, '578547', DATE_ADD('2026-09-17', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-17 06:30', INTERVAL @off DAY)),
 (13, 1, '128732', DATE_ADD('2026-09-20', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-20 06:30', INTERVAL @off DAY)),
 (14, 1, '777746', DATE_ADD('2026-09-21', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-21 06:30', INTERVAL @off DAY)),
 (15, 1, '941708', DATE_ADD('2026-09-22', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-22 06:30', INTERVAL @off DAY)),
 (16, 1, '669479', DATE_ADD('2026-09-24', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-24 06:30', INTERVAL @off DAY)),
 (17, 1, '691569', DATE_ADD('2026-09-27', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-27 06:30', INTERVAL @off DAY)),
 (18, 1, '821024', DATE_ADD('2026-09-28', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-28 06:30', INTERVAL @off DAY)),
 (19, 1, '353479', DATE_ADD('2026-09-15', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-15 06:30', INTERVAL @off DAY)),
 (20, 1, '253683', DATE_ADD('2026-09-23', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-23 06:30', INTERVAL @off DAY)),
 (21, 2, '703396', DATE_ADD('2026-09-06', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-06 06:30', INTERVAL @off DAY)),
 (22, 2, '773794', DATE_ADD('2026-09-07', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-07 06:30', INTERVAL @off DAY)),
 (23, 2, '340273', DATE_ADD('2026-09-08', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-08 06:30', INTERVAL @off DAY)),
 (24, 2, '213652', DATE_ADD('2026-09-09', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-09 06:30', INTERVAL @off DAY)),
 (25, 2, '260183', DATE_ADD('2026-09-10', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-10 06:30', INTERVAL @off DAY)),
 (26, 2, '644598', DATE_ADD('2026-09-13', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-13 06:30', INTERVAL @off DAY)),
 (27, 2, '185458', DATE_ADD('2026-09-14', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-14 06:30', INTERVAL @off DAY)),
 (28, 2, '372945', DATE_ADD('2026-09-15', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-15 06:30', INTERVAL @off DAY)),
 (29, 2, '282803', DATE_ADD('2026-09-16', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-16 06:30', INTERVAL @off DAY)),
 (30, 2, '555066', DATE_ADD('2026-09-17', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-17 06:30', INTERVAL @off DAY)),
 (31, 2, '231142', DATE_ADD('2026-09-20', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-20 06:30', INTERVAL @off DAY)),
 (32, 2, '719234', DATE_ADD('2026-09-22', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-22 06:30', INTERVAL @off DAY)),
 (33, 2, '334191', DATE_ADD('2026-09-23', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-23 06:30', INTERVAL @off DAY)),
 (34, 2, '668595', DATE_ADD('2026-09-24', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-24 06:30', INTERVAL @off DAY)),
 (35, 2, '206990', DATE_ADD('2026-09-27', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-27 06:30', INTERVAL @off DAY)),
 (36, 2, '256440', DATE_ADD('2026-09-28', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-28 06:30', INTERVAL @off DAY)),
 (37, 2, '401118', DATE_ADD('2026-09-29', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-29 06:30', INTERVAL @off DAY)),
 (38, 2, '453618', DATE_ADD('2026-09-21', INTERVAL @off DAY), TRUE, DATE_ADD('2026-09-21 06:30', INTERVAL @off DAY));
INSERT INTO attendance_records (attendance_id, student_id, daily_code_id, check_in_time, approval_status, reviewed_by, reviewed_at) VALUES
 (1, 1, 4, DATE_ADD('2026-09-06 07:40:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-07 09:00', INTERVAL @off DAY)),
 (2, 1, 5, DATE_ADD('2026-09-07 07:53:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-08 09:00', INTERVAL @off DAY)),
 (3, 1, 6, DATE_ADD('2026-09-08 07:47:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-09 09:00', INTERVAL @off DAY)),
 (4, 1, 7, DATE_ADD('2026-09-09 07:41:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-10 09:00', INTERVAL @off DAY)),
 (5, 1, 8, DATE_ADD('2026-09-10 07:57:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-11 09:00', INTERVAL @off DAY)),
 (6, 1, 9, DATE_ADD('2026-09-13 07:58:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-14 09:00', INTERVAL @off DAY)),
 (7, 1, 10, DATE_ADD('2026-09-14 07:52:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-15 09:00', INTERVAL @off DAY)),
 (8, 1, 11, DATE_ADD('2026-09-16 07:40:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-17 09:00', INTERVAL @off DAY)),
 (9, 1, 12, DATE_ADD('2026-09-17 07:53:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-18 09:00', INTERVAL @off DAY)),
 (10, 1, 13, DATE_ADD('2026-09-20 07:57:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-21 09:00', INTERVAL @off DAY)),
 (11, 1, 14, DATE_ADD('2026-09-21 07:51:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-22 09:00', INTERVAL @off DAY)),
 (12, 1, 15, DATE_ADD('2026-09-22 07:45:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-23 09:00', INTERVAL @off DAY)),
 (13, 1, 16, DATE_ADD('2026-09-24 07:52:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-25 09:00', INTERVAL @off DAY)),
 (14, 1, 17, DATE_ADD('2026-09-27 07:53:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY)),
 (15, 1, 18, DATE_ADD('2026-09-28 07:47:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (16, 1, 1, DATE_ADD('2026-09-29 07:41:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (17, 2, 4, DATE_ADD('2026-09-06 07:47:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-07 09:00', INTERVAL @off DAY)),
 (18, 2, 5, DATE_ADD('2026-09-07 07:41:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-08 09:00', INTERVAL @off DAY)),
 (19, 2, 6, DATE_ADD('2026-09-08 07:54:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-09 09:00', INTERVAL @off DAY)),
 (20, 2, 7, DATE_ADD('2026-09-09 07:48:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-10 09:00', INTERVAL @off DAY)),
 (21, 2, 8, DATE_ADD('2026-09-10 07:45:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-11 09:00', INTERVAL @off DAY)),
 (22, 2, 9, DATE_ADD('2026-09-13 07:46:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-14 09:00', INTERVAL @off DAY)),
 (23, 2, 10, DATE_ADD('2026-09-14 07:40:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-15 09:00', INTERVAL @off DAY)),
 (24, 2, 19, DATE_ADD('2026-09-15 07:53:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-16 09:00', INTERVAL @off DAY)),
 (25, 2, 11, DATE_ADD('2026-09-16 07:47:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-17 09:00', INTERVAL @off DAY)),
 (26, 2, 12, DATE_ADD('2026-09-17 07:41:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-18 09:00', INTERVAL @off DAY)),
 (27, 2, 13, DATE_ADD('2026-09-20 07:45:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-21 09:00', INTERVAL @off DAY)),
 (28, 2, 14, DATE_ADD('2026-09-21 07:58:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-22 09:00', INTERVAL @off DAY)),
 (29, 2, 15, DATE_ADD('2026-09-22 07:52:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-23 09:00', INTERVAL @off DAY)),
 (30, 2, 20, DATE_ADD('2026-09-23 07:46:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-24 09:00', INTERVAL @off DAY)),
 (31, 2, 16, DATE_ADD('2026-09-24 07:40:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-25 09:00', INTERVAL @off DAY)),
 (32, 2, 17, DATE_ADD('2026-09-27 07:41:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY)),
 (33, 2, 18, DATE_ADD('2026-09-28 07:54:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (34, 2, 1, DATE_ADD('2026-09-29 07:48:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (35, 3, 4, DATE_ADD('2026-09-06 07:54:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-07 09:00', INTERVAL @off DAY)),
 (36, 3, 5, DATE_ADD('2026-09-07 07:48:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-08 09:00', INTERVAL @off DAY)),
 (37, 3, 6, DATE_ADD('2026-09-08 07:42:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-09 09:00', INTERVAL @off DAY)),
 (38, 3, 7, DATE_ADD('2026-09-09 07:55:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-10 09:00', INTERVAL @off DAY)),
 (39, 3, 9, DATE_ADD('2026-09-13 07:53:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-14 09:00', INTERVAL @off DAY)),
 (40, 3, 10, DATE_ADD('2026-09-14 07:47:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-15 09:00', INTERVAL @off DAY)),
 (41, 3, 19, DATE_ADD('2026-09-15 07:41:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-16 09:00', INTERVAL @off DAY)),
 (42, 3, 11, DATE_ADD('2026-09-16 07:54:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-17 09:00', INTERVAL @off DAY)),
 (43, 3, 13, DATE_ADD('2026-09-20 07:52:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-21 09:00', INTERVAL @off DAY)),
 (44, 3, 14, DATE_ADD('2026-09-21 07:46:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-22 09:00', INTERVAL @off DAY)),
 (45, 3, 15, DATE_ADD('2026-09-22 07:40:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-23 09:00', INTERVAL @off DAY)),
 (46, 3, 20, DATE_ADD('2026-09-23 07:53:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-24 09:00', INTERVAL @off DAY)),
 (47, 3, 17, DATE_ADD('2026-09-27 07:48:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY)),
 (48, 3, 18, DATE_ADD('2026-09-28 07:42:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (49, 3, 1, DATE_ADD('2026-09-29 07:55:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (50, 4, 21, DATE_ADD('2026-09-06 07:42:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-07 09:00', INTERVAL @off DAY)),
 (51, 4, 22, DATE_ADD('2026-09-07 07:55:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-08 09:00', INTERVAL @off DAY)),
 (52, 4, 23, DATE_ADD('2026-09-08 07:49:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-09 09:00', INTERVAL @off DAY)),
 (53, 4, 24, DATE_ADD('2026-09-09 07:43:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-10 09:00', INTERVAL @off DAY)),
 (54, 4, 25, DATE_ADD('2026-09-10 07:40:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-11 09:00', INTERVAL @off DAY)),
 (55, 4, 26, DATE_ADD('2026-09-13 07:41:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-14 09:00', INTERVAL @off DAY)),
 (56, 4, 27, DATE_ADD('2026-09-14 07:54:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-15 09:00', INTERVAL @off DAY)),
 (57, 4, 28, DATE_ADD('2026-09-15 07:48:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-16 09:00', INTERVAL @off DAY)),
 (58, 4, 29, DATE_ADD('2026-09-16 07:42:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-17 09:00', INTERVAL @off DAY)),
 (59, 4, 30, DATE_ADD('2026-09-17 07:55:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-18 09:00', INTERVAL @off DAY)),
 (60, 4, 31, DATE_ADD('2026-09-20 07:40:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-21 09:00', INTERVAL @off DAY)),
 (61, 4, 32, DATE_ADD('2026-09-22 07:47:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-23 09:00', INTERVAL @off DAY)),
 (62, 4, 33, DATE_ADD('2026-09-23 07:41:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-24 09:00', INTERVAL @off DAY)),
 (63, 4, 34, DATE_ADD('2026-09-24 07:54:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-25 09:00', INTERVAL @off DAY)),
 (64, 4, 35, DATE_ADD('2026-09-27 07:55:00', INTERVAL @off DAY), 'Approved', 1, DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY)),
 (65, 4, 36, DATE_ADD('2026-09-28 07:49:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (66, 4, 37, DATE_ADD('2026-09-29 07:43:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (67, 5, 21, DATE_ADD('2026-09-06 07:49:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-07 09:00', INTERVAL @off DAY)),
 (68, 5, 22, DATE_ADD('2026-09-07 07:43:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-08 09:00', INTERVAL @off DAY)),
 (69, 5, 24, DATE_ADD('2026-09-09 07:50:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-10 09:00', INTERVAL @off DAY)),
 (70, 5, 25, DATE_ADD('2026-09-10 07:47:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-11 09:00', INTERVAL @off DAY)),
 (71, 5, 26, DATE_ADD('2026-09-13 07:48:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-14 09:00', INTERVAL @off DAY)),
 (72, 5, 27, DATE_ADD('2026-09-14 07:42:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-15 09:00', INTERVAL @off DAY)),
 (73, 5, 28, DATE_ADD('2026-09-15 07:55:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-16 09:00', INTERVAL @off DAY)),
 (74, 5, 29, DATE_ADD('2026-09-16 07:49:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-17 09:00', INTERVAL @off DAY)),
 (75, 5, 30, DATE_ADD('2026-09-17 07:43:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-18 09:00', INTERVAL @off DAY)),
 (76, 5, 31, DATE_ADD('2026-09-20 07:47:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-21 09:00', INTERVAL @off DAY)),
 (77, 5, 38, DATE_ADD('2026-09-21 07:41:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-22 09:00', INTERVAL @off DAY)),
 (78, 5, 33, DATE_ADD('2026-09-23 07:48:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-24 09:00', INTERVAL @off DAY)),
 (79, 5, 34, DATE_ADD('2026-09-24 07:42:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-25 09:00', INTERVAL @off DAY)),
 (80, 5, 35, DATE_ADD('2026-09-27 07:43:00', INTERVAL @off DAY), 'Approved', 2, DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY)),
 (81, 5, 36, DATE_ADD('2026-09-28 07:56:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (82, 5, 37, DATE_ADD('2026-09-29 07:50:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (83, 2, 2, DATE_ADD('2026-09-30 07:46:00', INTERVAL @off DAY), 'Pending', NULL, NULL),
 (84, 4, 3, DATE_ADD('2026-09-30 07:51:00', INTERVAL @off DAY), 'Pending', NULL, NULL);
UPDATE daily_codes SET is_active = FALSE WHERE code_date < CURDATE() OR code = '107364';
INSERT INTO final_reports (report_id, student_id, placement_id, supervisor_id, file_path, original_file_name, file_type, file_size_bytes, submitted_at, review_status, review_comments, reviewed_at) VALUES
 (1, 2, 1, 1, 'reports/demo_r1.pdf', 'Anas_Alamri_Final_Report.pdf', 'PDF', 1843200, DATE_ADD('2026-09-28 16:20', INTERVAL @off DAY), 'Submitted', NULL, NULL),
 (2, 4, 2, 1, 'reports/demo_r2.docx', 'Hamad_Alghubari_Final_Report.docx', 'DOCX', 942000, DATE_ADD('2026-09-25 16:20', INTERVAL @off DAY), 'Request Revision', 'Please add the KPI appendix and fix the references.', DATE_ADD('2026-09-27 09:00', INTERVAL @off DAY));
INSERT INTO evaluations (evaluation_id, student_id, placement_id, evaluator_type, supervisor_id, score, comments, evaluated_at) VALUES
 (1, 4, 2, 'Company', NULL, 88, 'Reliable on shift handovers; logs are accurate and on time.', DATE_ADD('2026-09-24 13:00', INTERVAL @off DAY)),
 (2, 2, 1, 'Company', NULL, 92, 'Built the weekly KPI sheet the warehouse team now uses.', DATE_ADD('2026-09-27 13:00', INTERVAL @off DAY)),
 (3, 3, 1, 'Company', NULL, 54, 'Missed three weekly reporting deadlines and needs closer follow-up on stock counts. Improved in the last week.', DATE_ADD('2026-09-28 13:00', INTERVAL @off DAY));
-- notification_type keeps the interface message key; message keeps its values as JSON (shown in English or Arabic)
INSERT INTO notifications (notification_id, user_id, notification_type, message, is_read, email_status, sent_at) VALUES
 (1, 1, 'nAttApproved', '{"d":"2026-09-27"}', FALSE, 'Sent', DATE_ADD('2026-09-28 09:10', INTERVAL @off DAY)),
 (2, 1, 'nCodeReminder', '{}', FALSE, 'Sent', DATE_ADD('2026-09-30 07:30', INTERVAL @off DAY)),
 (3, 1, 'nAppAccepted', '{"o":"Supply Chain Analyst Trainee"}', TRUE, 'Sent', DATE_ADD('2026-08-25 11:02', INTERVAL @off DAY)),
 (4, 6, 'nWelcome', '{}', FALSE, 'Sent', DATE_ADD('2026-09-29 10:00', INTERVAL @off DAY)),
 (5, 9, 'nNewApp', '{"n":"Hind Al-Zahrani","o":"HR Operations Trainee"}', FALSE, 'Sent', DATE_ADD('2026-09-22 13:40', INTERVAL @off DAY)),
 (6, 9, 'nOppPending', '{"o":"Customs and Trade Compliance Trainee"}', TRUE, 'Sent', DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY)),
 (7, 13, 'nReportIn', '{"n":"Anas Ahmed Alamri"}', FALSE, 'Sent', DATE_ADD('2026-09-28 16:20', INTERVAL @off DAY)),
 (8, 13, 'nAttPending', '{"c":8}', FALSE, 'Sent', DATE_ADD('2026-09-30 08:00', INTERVAL @off DAY)),
 (9, 15, 'nCompanyPending', '{"n":"Khobar Digital Solutions"}', FALSE, 'Sent', DATE_ADD('2026-09-29 12:15', INTERVAL @off DAY)),
 (10, 15, 'nOppNew', '{"o":"Customs and Trade Compliance Trainee"}', FALSE, 'Sent', DATE_ADD('2026-09-28 09:00', INTERVAL @off DAY));
INSERT INTO audit_logs (log_id, user_id, action, created_at) VALUES
 (1, 15, 'Approved company Eastern Logistics Co.', DATE_ADD('2026-08-10 09:12', INTERVAL @off DAY)),
 (2, 15, 'Approved opportunity Supply Chain Analyst Trainee', DATE_ADD('2026-08-12 10:40', INTERVAL @off DAY)),
 (3, 15, 'Assigned Abdullah Rashed Alrumi to Ahmed Abdulmohsen Almousa', DATE_ADD('2026-09-01 08:05', INTERVAL @off DAY)),
 (4, 15, 'Suspended account Turki Al-Anazi', DATE_ADD('2026-09-18 13:22', INTERVAL @off DAY)),
 (5, 9, 'Generated daily code for Supply Chain Analyst Trainee', DATE_ADD('2026-09-30 07:30', INTERVAL @off DAY));
-- chat: one placement group and five direct conversations; messages after last_read_at show as unread
INSERT INTO conversations (conversation_id, kind, title, created_by, created_at) VALUES
 (1, 'Group', 'Supply Chain Analyst Trainee · Eastern Logistics', 9, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY)),
 (2, 'Direct', NULL, 13, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY)),
 (3, 'Direct', NULL, 13, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY)),
 (4, 'Direct', NULL, 6, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY)),
 (5, 'Direct', NULL, 2, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY)),
 (6, 'Direct', NULL, 9, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY));
INSERT INTO conversation_members (conversation_id, user_id, joined_at, last_read_at) VALUES
 (1, 9, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (1, 1, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (1, 2, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (1, 3, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (1, 13, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (2, 1, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (2, 13, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (3, 9, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (3, 13, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (4, 6, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (4, 15, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (5, 2, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (5, 13, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (6, 1, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY)),
 (6, 9, DATE_ADD('2026-09-07 08:00', INTERVAL @off DAY), DATE_ADD('2026-09-29 12:00', INTERVAL @off DAY));
INSERT INTO messages (conversation_id, sender_id, body, sent_at) VALUES
 (1, 9, 'Good morning all. Today’s attendance code is on the screen next to reception.', DATE_ADD('2026-09-30 07:31', INTERVAL @off DAY)),
 (1, 2, 'Thank you, checked in.', DATE_ADD('2026-09-30 07:47', INTERVAL @off DAY)),
 (1, 9, 'Reminder: the weekly KPI review moves to Thursday at 10:00 in meeting room 2.', DATE_ADD('2026-09-30 08:05', INTERVAL @off DAY)),
 (1, 13, 'I will join the Thursday review for the first 30 minutes to meet the team.', DATE_ADD('2026-09-30 08:20', INTERVAL @off DAY)),
 (2, 13, 'Ahmed, please share an outline of your final report by 8 October so I can comment early.', DATE_ADD('2026-09-28 10:02', INTERVAL @off DAY)),
 (2, 1, 'Sure, Mr. Abdullah. Should the report follow the college template or the company one?', DATE_ADD('2026-09-28 10:15', INTERVAL @off DAY)),
 (2, 13, 'Use the college template, and add the company KPIs as an appendix.', DATE_ADD('2026-09-28 10:21', INTERVAL @off DAY)),
 (3, 13, 'Could I schedule a site visit for my three trainees next week?', DATE_ADD('2026-09-27 12:40', INTERVAL @off DAY)),
 (3, 9, 'Tuesday 6 October at 11:00 works for us. Please bring your college ID for the gate.', DATE_ADD('2026-09-27 13:05', INTERVAL @off DAY)),
 (4, 6, 'When will new opportunities for Business Administration open?', DATE_ADD('2026-09-29 09:30', INTERVAL @off DAY)),
 (4, 15, 'Two new postings are waiting for approval this week. You will get a notification when they go live.', DATE_ADD('2026-09-29 11:12', INTERVAL @off DAY)),
 (5, 2, 'I uploaded my final report. Please let me know if anything needs changes.', DATE_ADD('2026-09-28 16:22', INTERVAL @off DAY)),
 (6, 9, 'Ahmed, please bring the stock count sheets from warehouse B tomorrow morning.', DATE_ADD('2026-09-29 15:10', INTERVAL @off DAY));
INSERT INTO contact_messages (full_name, email, topic, message, created_at) VALUES
 ('Faisal Al-Dossary', 'faisal@example.com', 'Company', 'We would like to offer COOP seats for logistics students next term.', DATE_ADD('2026-09-26 11:30', INTERVAL @off DAY));
