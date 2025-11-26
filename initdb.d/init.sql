-- Database Schema for Book Reading Application (Final, Cleaned DDL)
-- Tables and ENUM values standardized to lowercase and uppercase.

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if exist (Reverse order for safety)
DROP TABLE IF EXISTS `result_images`;
DROP TABLE IF EXISTS `vote`;
DROP TABLE IF EXISTS `dialogue_answer`;
DROP TABLE IF EXISTS `share_request`;
DROP TABLE IF EXISTS `story`;
DROP TABLE IF EXISTS `dialogue_question`;
DROP TABLE IF EXISTS `contest_result`;
DROP TABLE IF EXISTS `reply`;
DROP TABLE IF EXISTS `share_board`;
DROP TABLE IF EXISTS `contest_details`;
DROP TABLE IF EXISTS `challenge_details`;
DROP TABLE IF EXISTS `subscription`;
DROP TABLE IF EXISTS `package_book`;
DROP TABLE IF EXISTS `dialogue`;
DROP TABLE IF EXISTS `book_details`;
DROP TABLE IF EXISTS `contest`;
DROP TABLE IF EXISTS `package`;
DROP TABLE IF EXISTS `board`;
DROP TABLE IF EXISTS `notice`;
DROP TABLE IF EXISTS `book`;
DROP TABLE IF EXISTS `reader`;
DROP TABLE IF EXISTS `children`;
DROP TABLE IF EXISTS `challenge`;
DROP TABLE IF EXISTS `package_categories`;
DROP TABLE IF EXISTS `image`;
DROP TABLE IF EXISTS `refresh_token`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `email_verify`;


-- ========================================
-- BASE TABLES (Independent)
-- ========================================

-- Table: email_verify
CREATE TABLE `email_verify` (
    `verify_id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` varchar(255) NOT NULL,
    `code` varchar(255) NOT NULL,
    `expired_at` DATETIME,
    PRIMARY KEY (`verify_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user
CREATE TABLE `user` (
    `user_id` bigint NOT NULL AUTO_INCREMENT,
    `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
    `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `birth` date DEFAULT NULL,
    `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `nickname` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `profile_img` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `role` enum('ADMIN','USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
    `reset_token` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `reset_token_expiry` datetime DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `email` (`email`),
    UNIQUE KEY `nickname` (`nickname`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: refresh_token
CREATE TABLE `refresh_token` (
    `id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL,
    `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: package_categories
CREATE TABLE `package_categories` (
    `category_id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: challenge
CREATE TABLE `challenge` (
    `challenge_id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: image
CREATE TABLE `image` (
    `image_id` BIGINT NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NULL,
    `file_path` VARCHAR(255) NULL,
    `usage_type` VARCHAR(50) NULL,
    PRIMARY KEY (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ========================================
-- FIRST LEVEL DEPENDENCIES
-- ========================================

-- Table: children
CREATE TABLE `children` (
    `child_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `child_name` VARCHAR(50) NOT NULL,
    `child_birth` DATE NULL,
    `gender` ENUM('M', 'F') NULL,
    `birth_order` INT NULL COMMENT 'Child order number',
    `profile_img` VARCHAR(255) NULL,
    `color` VARCHAR(10) NULL,
    PRIMARY KEY (`child_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_children_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: reader
CREATE TABLE `reader` (
    `reader_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `child_id` BIGINT NULL,
    `reader_type` ENUM('ADULT', 'CHILD') NOT NULL,
    PRIMARY KEY (`reader_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_child_id` (`child_id`),
    CONSTRAINT `fk_reader_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reader_children` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: book
CREATE TABLE `book` (
    `book_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `image_id` BIGINT NULL,
    `title` VARCHAR(255) NOT NULL,
    `author` VARCHAR(100) NULL,
    `publisher` VARCHAR(100) NULL,
    `isbn13` VARCHAR(15) NULL,
    `publication_year` VARCHAR(5) NULL,
    `cover_url` VARCHAR(500) NULL,
    `description` TEXT NULL,
    PRIMARY KEY (`book_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_image_id` (`image_id`),
    CONSTRAINT `fk_book_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_book_image` FOREIGN KEY (`image_id`) REFERENCES `image` (`image_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: package
CREATE TABLE `package` (
    `package_id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`package_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_package_category` FOREIGN KEY (`category_id`) REFERENCES `package_categories` (`category_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_package_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: contest
CREATE TABLE `contest` (
    `contest_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NULL,
    `start_date` DATETIME NULL,
    `end_date` DATETIME NULL,
    `progress_status` ENUM('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `image` VARCHAR(500) NULL,
    PRIMARY KEY (`contest_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_progress_status` (`progress_status`),
    CONSTRAINT `fk_contest_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: board
CREATE TABLE `board` (
    `board_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `image_id` BIGINT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`board_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_image_id` (`image_id`),
    CONSTRAINT `fk_board_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_board_image` FOREIGN KEY (`image_id`) REFERENCES `image` (`image_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: notice
CREATE TABLE `notice` (
    `notice_id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint DEFAULT NULL,
    `image_id` bigint DEFAULT NULL,
    `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
    `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`notice_id`),
    KEY `fk_notice_user` (`user_id`),
    KEY `fk_notice_image` (`image_id`),
    CONSTRAINT `fk_notice_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notice_image` FOREIGN KEY (`image_id`) REFERENCES `image` (`image_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SECOND LEVEL DEPENDENCIES
-- ========================================

-- Table: book_details
CREATE TABLE `book_details` (
    `details_id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `reader_id` BIGINT NOT NULL,
    `reading_status` ENUM('TO_READ', 'READING', 'COMPLETED') NOT NULL DEFAULT 'TO_READ',
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`details_id`),
    KEY `idx_book_id` (`book_id`),
    KEY `idx_reader_id` (`reader_id`),
    CONSTRAINT `fk_book_details_book` FOREIGN KEY (`book_id`) REFERENCES `book` (`book_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_book_details_reader` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`reader_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: dialogue
CREATE TABLE `dialogue` (
    `dialog_id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`dialog_id`),
    KEY `idx_book_id` (`book_id`),
    CONSTRAINT `fk_dialogue_book` FOREIGN KEY (`book_id`) REFERENCES `book` (`book_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: package_book
CREATE TABLE `package_book` (
    `package_book_id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `package_id` BIGINT NOT NULL,
    PRIMARY KEY (`package_book_id`),
    KEY `idx_book_id` (`book_id`),
    KEY `idx_package_id` (`package_id`),
    CONSTRAINT `fk_package_book_book` FOREIGN KEY (`book_id`) REFERENCES `book` (`book_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_package_book_package` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: subscription
CREATE TABLE `subscription` (
    `subscription_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `package_id` BIGINT NOT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `auto_renew` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `payment_method` VARCHAR(50) NULL,
    `payment_status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (`subscription_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_package_id` (`package_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_subscription_package` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: challenge_details
CREATE TABLE `challenge_details` (
    `details_id` BIGINT NOT NULL AUTO_INCREMENT,
    `challenge_id` BIGINT NOT NULL,
    `child_id` BIGINT NULL,
    `content` TEXT NULL,
    `success` BOOLEAN NOT NULL DEFAULT FALSE,
    `completed_at` DATETIME NULL,
    PRIMARY KEY (`details_id`),
    KEY `idx_challenge_id` (`challenge_id`),
    KEY `idx_child_id` (`child_id`),
    CONSTRAINT `fk_challenge_details_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenge` (`challenge_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_challenge_details_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: contest_details
CREATE TABLE `contest_details` (
    `details_id` BIGINT NOT NULL AUTO_INCREMENT,
    `contest_id` BIGINT NOT NULL,
    `round` ENUM('ROUND_1', 'ROUND_2', 'ROUND_3', 'FINAL') NOT NULL,
    `start_prompt` TEXT NULL,
    `start_date` DATETIME NULL,
    `end_date` DATETIME NULL,
    `progress_status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (`details_id`),
    KEY `idx_contest_id` (`contest_id`),
    CONSTRAINT `fk_contest_details_contest` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`contest_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: share_board
CREATE TABLE `share_board` (
    `share_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `category_id` BIGINT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NULL,
    `image_id` BIGINT NULL,
    `location` VARCHAR(255) NULL,
    `meet_status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NULL,
    `max_participants` INT NULL,
    `current_participants` INT NOT NULL DEFAULT 1,
    `datetime` DATETIME NULL,
    `price` INT NULL DEFAULT 0,
    `book_status` ENUM('A', 'B', 'C') NOT NULL DEFAULT 'A' COMMENT '등급 : A, B, C',
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`share_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_image_id` (`image_id`),
    KEY `idx_datetime` (`datetime`),
    CONSTRAINT `fk_share_board_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_share_board_category` FOREIGN KEY (`category_id`) REFERENCES `package_categories` (`category_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_share_board_image` FOREIGN KEY (`image_id`) REFERENCES `image` (`image_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table: reply
CREATE TABLE `reply` (
    `reply_id` BIGINT NOT NULL AUTO_INCREMENT,
    `board_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `content` VARCHAR(500) NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`reply_id`),
    KEY `idx_board_id` (`board_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_reply_board` FOREIGN KEY (`board_id`) REFERENCES `board` (`board_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reply_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table: contest_result
CREATE TABLE `contest_result` (
    `result_id` BIGINT NOT NULL AUTO_INCREMENT,
    `contest_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NULL,
    `final_content` TEXT NULL,
    `cover_image` VARCHAR(500) NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`result_id`),
    KEY `idx_contest_id` (`contest_id`),
    CONSTRAINT `fk_contest_result_contest` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`contest_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- THIRD LEVEL DEPENDENCIES
-- ========================================

-- Table: dialogue_question
CREATE TABLE `dialogue_question` (
    `question_id` BIGINT NOT NULL AUTO_INCREMENT,
    `dialog_id` BIGINT NOT NULL,
    `question` TEXT NOT NULL,
    PRIMARY KEY (`question_id`),
    KEY `idx_dialog_id` (`dialog_id`),
    CONSTRAINT `fk_dialogue_question_dialogue` FOREIGN KEY (`dialog_id`) REFERENCES `dialogue` (`dialog_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: story
CREATE TABLE `story` (
    `story_id` BIGINT NOT NULL AUTO_INCREMENT,
    `details_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `content` TEXT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `vote_count` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`story_id`),
    KEY `idx_details_id` (`details_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_story_contest_details` FOREIGN KEY (`details_id`) REFERENCES `contest_details` (`details_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_story_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: share_request
CREATE TABLE `share_request` (
    `request_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `share_id` BIGINT NOT NULL,
    `content` TEXT NULL,
    `result_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`request_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_share_id` (`share_id`),
    KEY `idx_result_status` (`result_status`),
    CONSTRAINT `fk_share_request_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_share_request_share` FOREIGN KEY (`share_id`) REFERENCES `share_board` (`share_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: dialogue_answer
CREATE TABLE `dialogue_answer` (
    `answer_id` BIGINT NOT NULL AUTO_INCREMENT,
    `dialog_id` BIGINT NOT NULL,
    `reader_id` BIGINT NOT NULL,
    `question_id` BIGINT NOT NULL,
    `answer` TEXT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`answer_id`),
    KEY `idx_dialog_id` (`dialog_id`),
    KEY `idx_reader_id` (`reader_id`),
    KEY `idx_question_id` (`question_id`),
    CONSTRAINT `fk_dialogue_answer_dialogue` FOREIGN KEY (`dialog_id`) REFERENCES `dialogue` (`dialog_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dialogue_answer_reader` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`reader_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dialogue_answer_question` FOREIGN KEY (`question_id`) REFERENCES `dialogue_question` (`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: vote
CREATE TABLE `vote` (
    `vote_id` BIGINT NOT NULL AUTO_INCREMENT,
    `story_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `voted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`vote_id`),
    KEY `idx_story_id` (`story_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_vote_story` FOREIGN KEY (`story_id`) REFERENCES `story` (`story_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_vote_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_story_user` (`story_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: result_images
CREATE TABLE `result_images` (
    `image_id` BIGINT NOT NULL AUTO_INCREMENT,
    `result_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `image_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`image_id`),
    KEY `idx_result_id` (`result_id`),
    CONSTRAINT `fk_result_images_contest_result` FOREIGN KEY (`result_id`) REFERENCES `contest_result` (`result_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- DATA DUMP
-- ========================================
LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` (`user_id`, `email`, `username`, `password`, `birth`, `phone`, `nickname`, `color`, `address`, `profile_img`, `role`, `reset_token`, `reset_token_expiry`)
VALUES (1,'admin1@admin.com','admin1','$2a$10$UX7LPes/mDVlBOlpoZRl/u/6wRLongxZVEBrJN4a6XGdBXxjqL5Km','2000-01-01','010-1111-1111','admin1','#FFFFFF','admin',NULL,'ADMIN',NULL,NULL),
       (2,'admin2@admin.com','admin2','$2a$10$rP.0wpQ5KDjGhqvAceh5YO.poPHgikyHNlmMaLMJ.2rtZ9LX.2XG.','2000-01-01','010-1111-1111','admin2','#FFFFFF','admin',NULL,'ADMIN',NULL,NULL),
       (3,'admin3@admin.com','admin3','$2a$10$tDI0SWtroMdOpduPIQd2zOKVnvCDzx1qK7KSo.ZzrsF6s4IQE5W66','2000-01-01','010-1111-1111','admin3','#FFFFFF','admin',NULL,'ADMIN',NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;


LOCK TABLES `children` WRITE;
/*!40000 ALTER TABLE `children` DISABLE KEYS */;
INSERT INTO `children` (`child_id`, `user_id`, `child_name`, `child_birth`, `gender`, `birth_order`, `profile_img`, `color`)
VALUES (1, 2,'child1', '2018-05-15', 'M', 1, 'http://example.com/profiles/example.jpg', '#FF5733'),
       (2, 2,'child2', '2019-05-15', 'F', 2, 'http://example.com/profiles/example.jpg', '#FF5733'),
       (3, 3,'child3', '2017-05-15', 'M', 1, 'http://example.com/profiles/example.jpg', '#FF5733');
/*!40000 ALTER TABLE `children` ENABLE KEYS */;
UNLOCK TABLES;


-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
