-- Database Schema for Book Reading Application
-- Created with logical flow and proper dependencies
-- Updated to match BaseEntity configuration (create_at/update_at)

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if exist (in reverse order of creation)
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
DROP TABLE IF EXISTS `Subscription`;
DROP TABLE IF EXISTS `package_book`;
DROP TABLE IF EXISTS `dialogue`;
DROP TABLE IF EXISTS `book_details`;
DROP TABLE IF EXISTS `contest`;
DROP TABLE IF EXISTS `package`;
DROP TABLE IF EXISTS `board`;
DROP TABLE IF EXISTS `notice`;
DROP TABLE IF EXISTS `Book`;
DROP TABLE IF EXISTS `reader`;
DROP TABLE IF EXISTS `children`;
DROP TABLE IF EXISTS `challenge`;
DROP TABLE IF EXISTS `package_categories`;
DROP TABLE IF EXISTS `share_board_image`;
DROP TABLE IF EXISTS `board_image`;
DROP TABLE IF EXISTS `image`;
DROP TABLE IF EXISTS `book_category`;
DROP TABLE IF EXISTS `refresh_token`;
DROP TABLE IF EXISTS `user`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- Independent Tables (No Foreign Keys)
-- ========================================

-- User Table (must be created first as it's referenced by many tables)
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

-- Package Categories Table
CREATE TABLE `package_categories` (
    `category_id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challenge Table
CREATE TABLE `challenge` (
    `challenge_id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Board Image Table
CREATE TABLE `board_image` (
    `image_id` BIGINT NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NULL,
    `file_path` VARCHAR(255) NULL,
    PRIMARY KEY (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Share Board Image Table
CREATE TABLE `share_board_image` (
    `image_id` BIGINT NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NULL,
    `file_path` VARCHAR(255) NULL,
    PRIMARY KEY (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Image Table
CREATE TABLE `image` (
       `image_id` BIGINT NOT NULL AUTO_INCREMENT,
       `file_name` VARCHAR(255) NULL,
       `file_path` VARCHAR(255) NULL,
       PRIMARY KEY (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- First Level Dependencies
-- ========================================

-- Children Table (depends on user)
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

-- Reader Table (depends on user)
CREATE TABLE `reader` (
    `reader_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `child_id` BIGINT NULL,
    `reader_type` ENUM('adult', 'child') NOT NULL,
    PRIMARY KEY (`reader_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_child_id` (`child_id`),
    CONSTRAINT `fk_reader_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reader_children` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Book Table (depends on book_category)
CREATE TABLE `Book` (
    `book_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `img_url` VARCHAR(500) NULL,
    `author` VARCHAR(100) NULL,
    `publisher` VARCHAR(100) NULL,
    PRIMARY KEY (`book_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_Book_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Package Table (depends on package_categories and user)
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

-- Contest Table (depends on user)
CREATE TABLE `contest` (
    `contest_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NULL,
    `start_date` DATETIME NULL,
    `end_date` DATETIME NULL,
    `progress_status` ENUM('planned', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
    `image` VARCHAR(500) NULL,
    PRIMARY KEY (`contest_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_progress_status` (`progress_status`),
    CONSTRAINT `fk_contest_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Board Table (depends on user and board_image)
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
    CONSTRAINT `fk_board_image` FOREIGN KEY (`image_id`) REFERENCES `board_image` (`image_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Board Table (depends on user and board_image)
CREATE TABLE `notice` (
  `notice_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `image_id` bigint DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `update_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`notice_id`),
  KEY `fk_notice_user` (`user_id`),
  KEY `fk_notice_image` (`image_id`),
  CONSTRAINT `fk_notice_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notice_image` FOREIGN KEY (`image_id`) REFERENCES `board_image` (`image_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Second Level Dependencies
-- ========================================

-- Book Details Table (depends on Book and reader)
CREATE TABLE `book_details` (
    `details_id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `reader_id` BIGINT NOT NULL,
    `status` ENUM('to_read', 'reading', 'completed') NOT NULL DEFAULT 'to_read',
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`details_id`),
    KEY `idx_book_id` (`book_id`),
    KEY `idx_reader_id` (`reader_id`),
    CONSTRAINT `fk_book_details_book` FOREIGN KEY (`book_id`) REFERENCES `Book` (`book_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_book_details_reader` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`reader_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dialogue Table (depends on Book)
CREATE TABLE `dialogue` (
    `dialog_id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`dialog_id`),
    KEY `idx_book_id` (`book_id`),
    CONSTRAINT `fk_dialogue_book` FOREIGN KEY (`book_id`) REFERENCES `Book` (`book_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Package Book Table (depends on Book and package)
CREATE TABLE `package_book` (
    `packageBook_id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `package_id` BIGINT NOT NULL,
    PRIMARY KEY (`packageBook_id`),
    KEY `idx_book_id` (`book_id`),
    KEY `idx_package_id` (`package_id`),
    CONSTRAINT `fk_package_book_book` FOREIGN KEY (`book_id`) REFERENCES `Book` (`book_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_package_book_package` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription Table (depends on user and package)
CREATE TABLE `Subscription` (
    `subscription_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `package_id` BIGINT NOT NULL,
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `auto_renew` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    `payment_method` VARCHAR(50) NULL,
    `payment_status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `amount` DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (`subscription_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_package_id` (`package_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_subscription_package` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challenge Details Table (depends on challenge and children)
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

-- Contest Details Table (depends on contest)
CREATE TABLE `contest_details` (
    `details_id` BIGINT NOT NULL AUTO_INCREMENT,
    `contest_id` BIGINT NOT NULL,
    `round` ENUM('round_1', 'round_2', 'round_3', 'final') NOT NULL,
    `start_prompt` TEXT NULL,
    `start_date` DATETIME NULL,
    `end_date` DATETIME NULL,
    `progress_status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    PRIMARY KEY (`details_id`),
    KEY `idx_contest_id` (`contest_id`),
    CONSTRAINT `fk_contest_details_contest` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`contest_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Share Board Table (depends on user, package_categories, and share_board_image)
CREATE TABLE `share_board` (
    `share_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `category_id` BIGINT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NULL,
    `image_id` BIGINT NULL,
    `location` VARCHAR(255) NULL,
    `meet_status` ENUM('scheduled', 'completed', 'cancelled') NULL,
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
    CONSTRAINT `fk_share_board_image` FOREIGN KEY (`image_id`) REFERENCES `share_board_image` (`image_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reply Table (depends on board and user)
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

-- Contest Result Table (depends on contest)
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
-- Third Level Dependencies
-- ========================================

-- Dialogue Question Table (depends on dialogue)
CREATE TABLE `dialogue_question` (
    `question_id` BIGINT NOT NULL AUTO_INCREMENT,
    `dialog_id` BIGINT NOT NULL,
    `question` TEXT NOT NULL,
    PRIMARY KEY (`question_id`),
    KEY `idx_dialog_id` (`dialog_id`),
    CONSTRAINT `fk_dialogue_question_dialogue` FOREIGN KEY (`dialog_id`) REFERENCES `dialogue` (`dialog_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Story Table (depends on contest_details and user)
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

-- Share Request Table (depends on user and share_board)
CREATE TABLE `share_request` (
    `request_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `share_id` BIGINT NOT NULL,
    `content` TEXT NULL,
    `result_status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    `create_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `update_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`request_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_share_id` (`share_id`),
    KEY `idx_result_status` (`result_status`),
    CONSTRAINT `fk_share_request_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_share_request_share` FOREIGN KEY (`share_id`) REFERENCES `share_board` (`share_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dialogue Answer Table (depends on dialogue, reader, and dialogue_question)
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

-- Vote Table (depends on story and user)
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

-- Result Images Table (depends on contest_result)
CREATE TABLE `result_images` (
    `image_id` BIGINT NOT NULL AUTO_INCREMENT,
    `result_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `image_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`image_id`),
    KEY `idx_result_id` (`result_id`),
    CONSTRAINT `fk_result_images_contest_result` FOREIGN KEY (`result_id`) REFERENCES `contest_result` (`result_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Token Table (depends on user)
CREATE TABLE `refresh_token` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expiry_date` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (2,'admin1@admin.com','admin1','$2a$10$UX7LPes/mDVlBOlpoZRl/u/6wRLongxZVEBrJN4a6XGdBXxjqL5Km','2000-01-01','010-1111-1111','admin1','#FFFFFF','admin',NULL,'ADMIN',NULL,NULL),
                          (3,'admin2@admin.com','admin2','$2a$10$rP.0wpQ5KDjGhqvAceh5YO.poPHgikyHNlmMaLMJ.2rtZ9LX.2XG.','2000-01-01','010-1111-1111','admin2','#FFFFFF','admin',NULL,'ADMIN',NULL,NULL),
                          (4,'admin3@admin.com','admin3','$2a$10$tDI0SWtroMdOpduPIQd2zOKVnvCDzx1qK7KSo.ZzrsF6s4IQE5W66','2000-01-01','010-1111-1111','admin3','#FFFFFF','admin',NULL,'ADMIN',NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;


LOCK TABLES `children` WRITE;
/*!40000 ALTER TABLE `children` DISABLE KEYS */;
INSERT INTO `children` VALUES (1, 2,'child1', '2018-05-15', 'M', 1, 'http://example.com/profiles/example.jpg', '#FF5733'),
                              (2, 2,'child2', '2019-05-15', 'F', 2, 'http://example.com/profiles/example.jpg', '#FF5733'),
                              (3, 3,'child3', '2017-05-15', 'M', 1, 'http://example.com/profiles/example.jpg', '#FF5733');
/*!40000 ALTER TABLE `children` ENABLE KEYS */;
UNLOCK TABLES;