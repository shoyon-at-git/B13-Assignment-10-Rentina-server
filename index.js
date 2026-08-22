require("dotenv").config();

const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT;

const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const db = client.db("test");
const propertiesCollection = db.collection("properties");

async function run() {
    try {
        await client.connect();

        await client.db("admin").command({ ping: 1 });

        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

run();


app.get("/", (req, res) => {
    res.send("Rentina Server is Running...");
});

// =========================
// ADD Property
// =========================

app.post("/api/properties", async (req, res) => {
    try {
        console.log("Received property data:");
        console.log(req.body);

        const {
            ownerId,
            title,
            location,
            city,
            rent,
            bedrooms,
            bathrooms,
            area,
            description,
            image,
        } = req.body;

        // Check required text fields
        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "Owner ID is required",
            });
        }

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        if (!location) {
            return res.status(400).json({
                success: false,
                message: "Location is required",
            });
        }

        if (!city) {
            return res.status(400).json({
                success: false,
                message: "City is required",
            });
        }

        if (!description) {
            return res.status(400).json({
                success: false,
                message: "Description is required",
            });
        }

        if (!image) {
            return res.status(400).json({
                success: false,
                message: "Image is required",
            });
        }

        // Check numeric fields
        if (Number.isNaN(Number(rent)) || Number(rent) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid rent",
            });
        }

        if (Number.isNaN(Number(bedrooms)) || Number(bedrooms) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid bedrooms",
            });
        }

        if (Number.isNaN(Number(bathrooms)) || Number(bathrooms) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid bathrooms",
            });
        }

        if (Number.isNaN(Number(area)) || Number(area) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid area",
            });
        }

        const propertyData = {
            ownerId,
            title,
            location,
            city,
            rent: Number(rent),
            bedrooms: Number(bedrooms),
            bathrooms: Number(bathrooms),
            area: Number(area),
            description,
            image,
            status: "available",
            createdAt: new Date(),
        };

        const result = await propertiesCollection.insertOne(
            propertyData
        );

        console.log("Property inserted:", result.insertedId);

        res.status(201).json({
            success: true,
            message: "Property added successfully",
            propertyId: result.insertedId.toString(),
        });
    } catch (error) {
        console.error("Add property error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add property",
        });
    }
});

// =========================
// GET My Properties
// =========================

app.get("/api/properties/my", async (req, res) => {
    try {
        const { ownerId } = req.query;

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "ownerId is required",
            });
        }

        const properties = await propertiesCollection
            .find({ ownerId: ownerId })
            .sort({ createdAt: -1 })
            .toArray();

        const formattedProperties = properties.map((property) => ({
            ...property,
            _id: property._id.toString(),
        }));

        res.status(200).json({
            success: true,
            properties: formattedProperties,
        });
    } catch (error) {
        console.error("Get properties error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch properties",
        });
    }
});

// =========================
// GET Single Property
// =========================

app.get("/api/properties/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId } = req.query;

        console.log("Get property request:", {
            id,
            ownerId,
        });

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Property ID is required",
            });
        }

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "Owner ID is required",
            });
        }

        const { ObjectId } = require("mongodb");

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid property ID",
            });
        }

        const property = await propertiesCollection.findOne({
            _id: new ObjectId(id),
            ownerId: ownerId,
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found",
            });
        }

        res.status(200).json({
            success: true,
            property: {
                ...property,
                _id: property._id.toString(),
            },
        });
    } catch (error) {
        console.error("Get property error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch property",
        });
    }
});




app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});