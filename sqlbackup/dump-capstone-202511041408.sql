-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: capstone
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Book`
--

DROP TABLE IF EXISTS `Book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Book` (
  `book_id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publisher` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isbn` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`book_id`),
  KEY `idx_category_id` (`category_id`),
  CONSTRAINT `fk_book_category` FOREIGN KEY (`category_id`) REFERENCES `book_category` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Book`
--

LOCK TABLES `Book` WRITE;
/*!40000 ALTER TABLE `Book` DISABLE KEYS */;
/*!40000 ALTER TABLE `Book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Subscription`
--

DROP TABLE IF EXISTS `Subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Subscription` (
  `subscription_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `package_id` bigint NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','expired','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`subscription_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_package_id` (`package_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_subscription_package` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Subscription`
--

LOCK TABLES `Subscription` WRITE;
/*!40000 ALTER TABLE `Subscription` DISABLE KEYS */;
/*!40000 ALTER TABLE `Subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board`
--

DROP TABLE IF EXISTS `board`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board` (
  `board_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `image_id` bigint DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`board_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_image_id` (`image_id`),
  CONSTRAINT `fk_board_image` FOREIGN KEY (`image_id`) REFERENCES `board_image` (`image_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_board_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board`
--

LOCK TABLES `board` WRITE;
/*!40000 ALTER TABLE `board` DISABLE KEYS */;
/*!40000 ALTER TABLE `board` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_image`
--

DROP TABLE IF EXISTS `board_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board_image` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_image`
--

LOCK TABLES `board_image` WRITE;
/*!40000 ALTER TABLE `board_image` DISABLE KEYS */;
/*!40000 ALTER TABLE `board_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_category`
--

DROP TABLE IF EXISTS `book_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_category` (
  `category_id` bigint NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_category`
--

LOCK TABLES `book_category` WRITE;
/*!40000 ALTER TABLE `book_category` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_details`
--

DROP TABLE IF EXISTS `book_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_details` (
  `details_id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `reader_id` bigint NOT NULL,
  `status` enum('to_read','reading','completed','on_hold','dropped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'to_read',
  `rating` tinyint DEFAULT NULL,
  `review` text COLLATE utf8mb4_unicode_ci,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `page_count` int DEFAULT NULL,
  `favorite` tinyint(1) NOT NULL DEFAULT '0',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`details_id`),
  KEY `idx_book_id` (`book_id`),
  KEY `idx_reader_id` (`reader_id`),
  CONSTRAINT `fk_book_details_book` FOREIGN KEY (`book_id`) REFERENCES `Book` (`book_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_book_details_reader` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`reader_id`) ON DELETE CASCADE,
  CONSTRAINT `book_details_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_details`
--

LOCK TABLES `book_details` WRITE;
/*!40000 ALTER TABLE `book_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge`
--

DROP TABLE IF EXISTS `challenge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge` (
  `challenge_id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge`
--

LOCK TABLES `challenge` WRITE;
/*!40000 ALTER TABLE `challenge` DISABLE KEYS */;
/*!40000 ALTER TABLE `challenge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenge_details`
--

DROP TABLE IF EXISTS `challenge_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_details` (
  `details_id` bigint NOT NULL AUTO_INCREMENT,
  `challenge_id` bigint NOT NULL,
  `child_id` bigint DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`details_id`),
  KEY `idx_challenge_id` (`challenge_id`),
  KEY `idx_child_id` (`child_id`),
  CONSTRAINT `fk_challenge_details_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenge` (`challenge_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_challenge_details_child` FOREIGN KEY (`child_id`) REFERENCES `children` (`child_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenge_details`
--

LOCK TABLES `challenge_details` WRITE;
/*!40000 ALTER TABLE `challenge_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `challenge_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `children`
--

DROP TABLE IF EXISTS `children`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `children` (
  `child_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `child_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `child_birth` date DEFAULT NULL,
  `gender` enum('M','F') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_order` int DEFAULT NULL COMMENT 'Child order number',
  `profile_img` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`child_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_children_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `children`
--

LOCK TABLES `children` WRITE;
/*!40000 ALTER TABLE `children` DISABLE KEYS */;
INSERT INTO `children` VALUES (1,6,'테스트자녀1','2025-11-03','M',3,'https://api.dicebear.com/7.x/micah/svg?seed=6km88qgdlgc','#00BFA5'),(2,6,'테스트자녀2','2025-11-01','F',4,'https://api.dicebear.com/7.x/initials/svg?seed=default','#FFCC80'),(3,7,'테스트자녀1','2025-11-03','M',1,'https://api.dicebear.com/7.x/fun-emoji/svg?seed=zicnv0ivkvh','#AA00FF'),(4,7,'테스트자녀2','2025-11-03','M',2,'https://api.dicebear.com/7.x/initials/svg?seed=default','#C0EB75');
/*!40000 ALTER TABLE `children` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contest`
--

DROP TABLE IF EXISTS `contest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest` (
  `contest_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `progress_status` enum('planned','ongoing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`contest_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_progress_status` (`progress_status`),
  CONSTRAINT `fk_contest_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contest`
--

LOCK TABLES `contest` WRITE;
/*!40000 ALTER TABLE `contest` DISABLE KEYS */;
/*!40000 ALTER TABLE `contest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contest_details`
--

DROP TABLE IF EXISTS `contest_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_details` (
  `details_id` bigint NOT NULL AUTO_INCREMENT,
  `contest_id` bigint NOT NULL,
  `round` enum('round_1','round_2','round_3','final') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_prompt` text COLLATE utf8mb4_unicode_ci,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `progress_status` enum('pending','in_progress','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`details_id`),
  KEY `idx_contest_id` (`contest_id`),
  CONSTRAINT `fk_contest_details_contest` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`contest_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contest_details`
--

LOCK TABLES `contest_details` WRITE;
/*!40000 ALTER TABLE `contest_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `contest_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contest_result`
--

DROP TABLE IF EXISTS `contest_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_result` (
  `result_id` bigint NOT NULL AUTO_INCREMENT,
  `contest_id` bigint NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `final_content` text COLLATE utf8mb4_unicode_ci,
  `cover_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`result_id`),
  KEY `idx_contest_id` (`contest_id`),
  CONSTRAINT `fk_contest_result_contest` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`contest_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contest_result`
--

LOCK TABLES `contest_result` WRITE;
/*!40000 ALTER TABLE `contest_result` DISABLE KEYS */;
/*!40000 ALTER TABLE `contest_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dialogue`
--

DROP TABLE IF EXISTS `dialogue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dialogue` (
  `dialog_id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`dialog_id`),
  KEY `idx_book_id` (`book_id`),
  CONSTRAINT `fk_dialogue_book` FOREIGN KEY (`book_id`) REFERENCES `Book` (`book_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dialogue`
--

LOCK TABLES `dialogue` WRITE;
/*!40000 ALTER TABLE `dialogue` DISABLE KEYS */;
/*!40000 ALTER TABLE `dialogue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dialogue_answer`
--

DROP TABLE IF EXISTS `dialogue_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dialogue_answer` (
  `answer_id` bigint NOT NULL AUTO_INCREMENT,
  `dialog_id` bigint NOT NULL,
  `reader_id` bigint NOT NULL,
  `question_id` bigint NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`answer_id`),
  KEY `idx_dialog_id` (`dialog_id`),
  KEY `idx_reader_id` (`reader_id`),
  KEY `idx_question_id` (`question_id`),
  CONSTRAINT `fk_dialogue_answer_dialogue` FOREIGN KEY (`dialog_id`) REFERENCES `dialogue` (`dialog_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dialogue_answer_question` FOREIGN KEY (`question_id`) REFERENCES `dialogue_question` (`question_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dialogue_answer_reader` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`reader_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dialogue_answer`
--

LOCK TABLES `dialogue_answer` WRITE;
/*!40000 ALTER TABLE `dialogue_answer` DISABLE KEYS */;
/*!40000 ALTER TABLE `dialogue_answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dialogue_question`
--

DROP TABLE IF EXISTS `dialogue_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dialogue_question` (
  `question_id` bigint NOT NULL AUTO_INCREMENT,
  `dialog_id` bigint NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`question_id`),
  KEY `idx_dialog_id` (`dialog_id`),
  CONSTRAINT `fk_dialogue_question_dialogue` FOREIGN KEY (`dialog_id`) REFERENCES `dialogue` (`dialog_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dialogue_question`
--

LOCK TABLES `dialogue_question` WRITE;
/*!40000 ALTER TABLE `dialogue_question` DISABLE KEYS */;
/*!40000 ALTER TABLE `dialogue_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package`
--

DROP TABLE IF EXISTS `package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package` (
  `package_id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`package_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_package_category` FOREIGN KEY (`category_id`) REFERENCES `package_categories` (`category_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_package_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package`
--

LOCK TABLES `package` WRITE;
/*!40000 ALTER TABLE `package` DISABLE KEYS */;
/*!40000 ALTER TABLE `package` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package_book`
--

DROP TABLE IF EXISTS `package_book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package_book` (
  `packageBook_id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `package_id` bigint NOT NULL,
  PRIMARY KEY (`packageBook_id`),
  KEY `idx_book_id` (`book_id`),
  KEY `idx_package_id` (`package_id`),
  CONSTRAINT `fk_package_book_book` FOREIGN KEY (`book_id`) REFERENCES `Book` (`book_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_package_book_package` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package_book`
--

LOCK TABLES `package_book` WRITE;
/*!40000 ALTER TABLE `package_book` DISABLE KEYS */;
/*!40000 ALTER TABLE `package_book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package_categories`
--

DROP TABLE IF EXISTS `package_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package_categories` (
  `category_id` bigint NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package_categories`
--

LOCK TABLES `package_categories` WRITE;
/*!40000 ALTER TABLE `package_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `package_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reader`
--

DROP TABLE IF EXISTS `reader`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reader` (
  `reader_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` enum('adult','child') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`reader_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_reader_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reader`
--

LOCK TABLES `reader` WRITE;
/*!40000 ALTER TABLE `reader` DISABLE KEYS */;
/*!40000 ALTER TABLE `reader` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_token`
--

DROP TABLE IF EXISTS `refresh_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_token` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_token`
--

LOCK TABLES `refresh_token` WRITE;
/*!40000 ALTER TABLE `refresh_token` DISABLE KEYS */;
INSERT INTO `refresh_token` VALUES (6,7,'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiI3IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NjIyMzEyNzMsImV4cCI6MTc2MjgzNjA3M30.O0qCabJK6GJY0xnS2Rov4AGREcvRmWC9rnhOhiLKD-GMHdzQ8Jbxv4Jy-xb_EAvu','2025-11-11 13:41:13');
/*!40000 ALTER TABLE `refresh_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reply`
--

DROP TABLE IF EXISTS `reply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reply` (
  `reply_id` bigint NOT NULL AUTO_INCREMENT,
  `board_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `content` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reply_id`),
  KEY `idx_board_id` (`board_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_reply_board` FOREIGN KEY (`board_id`) REFERENCES `board` (`board_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reply_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reply`
--

LOCK TABLES `reply` WRITE;
/*!40000 ALTER TABLE `reply` DISABLE KEYS */;
/*!40000 ALTER TABLE `reply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `result_images`
--

DROP TABLE IF EXISTS `result_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `result_images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `result_id` bigint NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`image_id`),
  KEY `idx_result_id` (`result_id`),
  CONSTRAINT `fk_result_images_contest_result` FOREIGN KEY (`result_id`) REFERENCES `contest_result` (`result_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `result_images`
--

LOCK TABLES `result_images` WRITE;
/*!40000 ALTER TABLE `result_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `result_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `share_board`
--

DROP TABLE IF EXISTS `share_board`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_board` (
  `share_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `category_id` bigint DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `image_id` bigint DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meet_status` enum('scheduled','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_participants` int DEFAULT NULL,
  `current_participants` int NOT NULL DEFAULT '1',
  `datetime` datetime DEFAULT NULL,
  `price` int DEFAULT '0',
  `book_status` enum('A','B','C') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'A' COMMENT 'ë“±ê¸‰ : A, B, C',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`share_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_image_id` (`image_id`),
  KEY `idx_datetime` (`datetime`),
  CONSTRAINT `fk_share_board_category` FOREIGN KEY (`category_id`) REFERENCES `package_categories` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_share_board_image` FOREIGN KEY (`image_id`) REFERENCES `share_board_image` (`image_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_share_board_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `share_board`
--

LOCK TABLES `share_board` WRITE;
/*!40000 ALTER TABLE `share_board` DISABLE KEYS */;
/*!40000 ALTER TABLE `share_board` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `share_board_image`
--

DROP TABLE IF EXISTS `share_board_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_board_image` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `share_board_image`
--

LOCK TABLES `share_board_image` WRITE;
/*!40000 ALTER TABLE `share_board_image` DISABLE KEYS */;
/*!40000 ALTER TABLE `share_board_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `share_request`
--

DROP TABLE IF EXISTS `share_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `share_request` (
  `request_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `share_id` bigint NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `result_status` enum('pending','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_share_id` (`share_id`),
  KEY `idx_result_status` (`result_status`),
  CONSTRAINT `fk_share_request_share` FOREIGN KEY (`share_id`) REFERENCES `share_board` (`share_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_share_request_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `share_request`
--

LOCK TABLES `share_request` WRITE;
/*!40000 ALTER TABLE `share_request` DISABLE KEYS */;
/*!40000 ALTER TABLE `share_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `story`
--

DROP TABLE IF EXISTS `story`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `story` (
  `story_id` bigint NOT NULL AUTO_INCREMENT,
  `details_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `create_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `vote_count` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`story_id`),
  KEY `idx_details_id` (`details_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_story_contest_details` FOREIGN KEY (`details_id`) REFERENCES `contest_details` (`details_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_story_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `story`
--

LOCK TABLES `story` WRITE;
/*!40000 ALTER TABLE `story` DISABLE KEYS */;
/*!40000 ALTER TABLE `story` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `profile_img` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `nickname` (`nickname`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (2,'admin1@admin.com','admin1','$2a$10$UX7LPes/mDVlBOlpoZRl/u/6wRLongxZVEBrJN4a6XGdBXxjqL5Km','2000-01-01','010-1111-1111','admin1','#FFFFFF','admin',NULL,'ADMIN'),(3,'admin2@admin.com','admin2','$2a$10$rP.0wpQ5KDjGhqvAceh5YO.poPHgikyHNlmMaLMJ.2rtZ9LX.2XG.','2000-01-01','010-1111-1111','admin2','#FFFFFF','admin',NULL,'ADMIN'),(4,'admin3@admin.com','admin3','$2a$10$tDI0SWtroMdOpduPIQd2zOKVnvCDzx1qK7KSo.ZzrsF6s4IQE5W66','2000-01-01','010-1111-1111','admin3','#FFFFFF','admin',NULL,'ADMIN'),(5,'test@test.com','테스트1','$2a$10$XRCGTP.lzs7O56eHbBDpF.y3A0swZCzen8O0tE6w8M/UXh5uCKrui','2025-11-01','010-1234-5678','테스트1','#D8B4FE','서울 강동구 동남로 482 (둔촌동) 테스트 주소1',NULL,'USER'),(6,'test2@test.com','테스트2','$2a$10$XNgE4RdKgz9EZC8sIXoR9epc.kdXKS/iBJo4jjcI2OxkQxr2wkt0q','2025-10-24','010-1234-5678','테스트2','#1DE9B6','서울 강동구 동남로 482 (둔촌동) 테스트주소 테스트주소2 테스트주소3',NULL,'USER'),(7,'test3@test.com','테스트3','$2a$10$WMYw6IFcfu7jITmcokibPOS6eF6jfiIoZ7TOYlKwT3PAqd0H8k5ji','2025-11-01','010-9876-5431','테스트3','#212529','서울 강동구 동남로 478 (둔촌동) 테스트주소3',NULL,'USER');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vote`
--

DROP TABLE IF EXISTS `vote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vote` (
  `vote_id` bigint NOT NULL AUTO_INCREMENT,
  `story_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `voted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vote_id`),
  UNIQUE KEY `uk_story_user` (`story_id`,`user_id`),
  KEY `idx_story_id` (`story_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_vote_story` FOREIGN KEY (`story_id`) REFERENCES `story` (`story_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vote_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vote`
--

LOCK TABLES `vote` WRITE;
/*!40000 ALTER TABLE `vote` DISABLE KEYS */;
/*!40000 ALTER TABLE `vote` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'capstone'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-04 14:08:36
