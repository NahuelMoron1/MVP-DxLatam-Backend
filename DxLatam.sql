CREATE DATABASE campaign_flow_builder;
USE campaign_flow_builder;

CREATE TABLE Contacts (
    id VARCHAR(36) PRIMARY KEY,

    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,

    phone VARCHAR(50) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,

    status ENUM('ACTIVE', 'INACTIVE')
    NOT NULL DEFAULT 'ACTIVE',

    attributes JSON NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL
);

CREATE INDEX idx_contacts_country
ON Contacts(country);

CREATE INDEX idx_contacts_status
ON Contacts(status);

CREATE INDEX idx_contacts_created
ON Contacts(created_at);

CREATE TABLE Campaigns (
    id VARCHAR(36) PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT NULL,

    status ENUM('draft', 'active')
    NOT NULL DEFAULT 'draft',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL
);

CREATE INDEX idx_campaign_status
ON Campaigns(status);

CREATE INDEX idx_campaign_created
ON Campaigns(created_at);

CREATE TABLE CanvasNodes (
    id VARCHAR(36) PRIMARY KEY,

    campaign_id VARCHAR(36) NOT NULL,

    type ENUM('segment', 'sms')
    NOT NULL,

    x FLOAT NOT NULL DEFAULT 0,
    y FLOAT NOT NULL DEFAULT 0,

    config JSON NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_canvas_nodes_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES Campaigns(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_canvas_nodes_campaign
ON CanvasNodes(campaign_id);

CREATE TABLE CanvasEdges (
    id VARCHAR(36) PRIMARY KEY,

    campaign_id VARCHAR(36) NOT NULL,

    source_node_id VARCHAR(36) NOT NULL,
    target_node_id VARCHAR(36) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_canvas_edges_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES Campaigns(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_source_node
        FOREIGN KEY (source_node_id)
        REFERENCES CanvasNodes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_target_node
        FOREIGN KEY (target_node_id)
        REFERENCES CanvasNodes(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_canvas_edges_campaign
ON CanvasEdges(campaign_id);

INSERT INTO Contacts (
    id,
    first_name,
    last_name,
    phone,
    email,
    country,
    city,
    status,
    attributes
)
VALUES
(
    UUID(),
    'Nahuel',
    'Moron',
    '223123456',
    'nahuel@test.com',
    'AR',
    'Mar del Plata',
    'ACTIVE',
    JSON_OBJECT(
        'age', 27,
        'plan', 'premium',
        'last_purchase_days', 15
    )
),
(
    UUID(),
    'Juan',
    'Perez',
    '223999999',
    'juan@test.com',
    'AR',
    'Buenos Aires',
    'ACTIVE',
    JSON_OBJECT(
        'age', 19,
        'plan', 'basic'
    )
);

SELECT *
FROM Contacts
WHERE JSON_EXTRACT(attributes, '$.age') > 20;