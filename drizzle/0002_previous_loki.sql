CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastOrderAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`amount` decimal(10,2) NOT NULL,
	`method` enum('cash','bank') NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`totalQuantity` int NOT NULL DEFAULT 0,
	`inUse` int NOT NULL DEFAULT 0,
	`broken` int NOT NULL DEFAULT 0,
	`available` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `equipment`;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE `inventory` ADD `minThreshold` decimal(10,2) DEFAULT '5.00';--> statement-breakpoint
ALTER TABLE `orders` ADD `customerId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` enum('cash','bank','pending') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;