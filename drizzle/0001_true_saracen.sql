CREATE TABLE `equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`totalStock` int NOT NULL DEFAULT 0,
	`inUse` int NOT NULL DEFAULT 0,
	`broken` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemName` text NOT NULL,
	`quantity` decimal(10,2) DEFAULT '0.00',
	`unit` varchar(32),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`category` varchar(64),
	`imageUrl` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`menuItemId` int,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seatingAreaId` int,
	`customerName` text,
	`totalAmount` decimal(10,2) DEFAULT '0.00',
	`status` enum('pending','preparing','ready','served','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int,
	`inventoryItemId` int,
	`quantityNeeded` decimal(10,2) NOT NULL,
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seating_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` varchar(64),
	`qrCodeIdentifier` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seating_areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `seating_areas_qrCodeIdentifier_unique` UNIQUE(`qrCodeIdentifier`)
);
--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_menuItemId_menu_items_id_fk` FOREIGN KEY (`menuItemId`) REFERENCES `menu_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_seatingAreaId_seating_areas_id_fk` FOREIGN KEY (`seatingAreaId`) REFERENCES `seating_areas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_menuItemId_menu_items_id_fk` FOREIGN KEY (`menuItemId`) REFERENCES `menu_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_inventoryItemId_inventory_id_fk` FOREIGN KEY (`inventoryItemId`) REFERENCES `inventory`(`id`) ON DELETE no action ON UPDATE no action;