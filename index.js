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
const bookingsCollection = db.collection("bookings");
const userCollection = db.collection("user");

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
      ownerEmail,
      ownerName,
      title,
      location,
      city,
      propertyType,
      rent,
      bedrooms,
      bathrooms,
      area,
      description,
      image,
      mapUrl,
    } = req.body;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }
    if (!ownerName) {
      return res.status(400).json({
        success: false,
        message: "Owner name is required",
      });
    }

    if (!ownerEmail) {
      return res.status(400).json({
        success: false,
        message: "Owner email is required",
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
//     if (!mapUrl) {
//   return res.status(400).json({
//     success: false,
//     message: "Google Maps URL is required",
//   });
// }
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
      ownerName,
      ownerEmail,
      title,
      location,
      city,
      propertyType,
      rent: Number(rent),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area: Number(area),
      description,
      image,
      mapUrl: mapUrl || "",
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
// GET All Available Properties
// =========================

app.get("/api/properties", async (req, res) => {
  try {
    const {
      search = "",
      propertyType = "",
      sort = "",
    } = req.query;

    // =========================
    // Filter
    // =========================

    const query = {
      status: "available",
    };

    // Location Search
    if (search.trim()) {
      query.location = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // Property Type Filter
    if (propertyType.trim()) {
      query.propertyType = propertyType.trim();
    }

    // =========================
    // Sort
    // =========================

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "low-to-high") {
      sortOption = {
        rent: 1,
      };
    }

    if (sort === "high-to-low") {
      sortOption = {
        rent: -1,
      };
    }

    // =========================
    // Get Properties
    // =========================

    const properties = await propertiesCollection
      .find(query)
      .sort(sortOption)
      .toArray();

    // =========================
    // Format Data
    // =========================

    const formattedProperties = properties.map((property) => ({
      ...property,
      _id: property._id.toString(),
    }));

    console.log("Property filters:", {
      search,
      propertyType,
      sort,
      total: formattedProperties.length,
    });

    res.status(200).json({
      success: true,
      properties: formattedProperties,
    });
  } catch (error) {
    console.error("Get all properties error:", error);

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

    console.log("Single property ID:", id);

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({
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

// =========================
// GET My Properties
// =========================

// =========================
// GET Owner Properties
// =========================

app.get("/api/owner-properties/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;

    console.log("Owner Properties Request");
    console.log("ownerId:", ownerId);

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }

    const properties = await propertiesCollection
      .find({
        ownerId: ownerId,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    const formattedProperties = properties.map((property) => ({
      ...property,
      _id: property._id.toString(),
    }));

    console.log(
      "Properties found:",
      formattedProperties.length
    );

    res.status(200).json({
      success: true,
      properties: formattedProperties,
    });
  } catch (error) {
    console.error(
      "Get owner properties error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch owner properties",
    });
  }
});




// =========================
// UPDATE Property
// =========================

app.put("/api/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      ownerId,
      title,
      location,
      city,
      propertyType,
      rent,
      bedrooms,
      bathrooms,
      area,
      description,
      image,
      mapUrl,
      status,
    } = req.body;

    console.log("Update property request:", {
      id,
      ownerId,
    });

    // Owner ID validation
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }

    // Property ID validation
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    // Required fields
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

    // Number validation
    if (Number(rent) <= 0 || Number.isNaN(Number(rent))) {
      return res.status(400).json({
        success: false,
        message: "Invalid rent",
      });
    }

    if (
      Number(bedrooms) <= 0 ||
      Number.isNaN(Number(bedrooms))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid bedrooms",
      });
    }

    if (
      Number(bathrooms) <= 0 ||
      Number.isNaN(Number(bathrooms))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid bathrooms",
      });
    }

    if (Number(area) <= 0 || Number.isNaN(Number(area))) {
      return res.status(400).json({
        success: false,
        message: "Invalid area",
      });
    }

    // Check property ownership
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this property",
      });
    }

    // Updated data
    const updatedProperty = {
      title,
      location,
      city,
      propertyType,
      rent: Number(rent),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area: Number(area),
      description,
      image: image || property.image,
      mapUrl: mapUrl || "",
      status: status || property.status,
      updatedAt: new Date(),
    };

    const result = await propertiesCollection.updateOne(
      {
        _id: new ObjectId(id),
        ownerId: ownerId,
      },
      {
        $set: updatedProperty,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Update property error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update property",
    });
  }
});

// =========================
// DELETE Property
// =========================

app.delete("/api/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "ownerId is required",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Make sure only the owner can delete the property
    if (property.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this property",
      });
    }

    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(id),
      ownerId: ownerId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Property could not be deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Delete property error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete property",
    });
  }
});

// =========================
// CREATE Booking / Rent Request
// =========================

app.post("/api/bookings", async (req, res) => {
  try {
    const {
      propertyId,
      tenantId,
      ownerId,
    } = req.body;

    console.log("Booking request:", req.body);

    // Check required fields
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required",
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
    }

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }

    // Check property ID
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    // Find property
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check property owner
    if (property.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "Invalid property owner",
      });
    }

    // Check availability
    if (property.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "This property is not available for rent",
      });
    }

    // Check duplicate pending/approved booking
    const existingBooking = await bookingsCollection.findOne({
      propertyId: propertyId,
      tenantId: tenantId,
      status: {
        $in: ["pending", "accepted"],
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You already have a booking for this property",
      });
    }

    // Create booking
    const bookingData = {
      propertyId: propertyId,
      tenantId: tenantId,
      ownerId: ownerId,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(
      bookingData
    );

    console.log(
      "Booking created:",
      result.insertedId
    );

    res.status(201).json({
      success: true,
      message: "Rental request sent successfully",
      bookingId: result.insertedId.toString(),
    });

  } catch (error) {
    console.error(
      "Create booking error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create rental request",
    });
  }
});

// =========================
// GET Owner Rental Requests
// =========================

// =========================
// GET Owner Booking Requests
// =========================

app.get("/api/bookings/owner/:ownerId", async (req, res) => {
    try {
        const { ownerId } = req.params;

        console.log("Owner rental requests:", ownerId);

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "Owner ID is required",
            });
        }

        const bookings = await bookingsCollection
            .find({
                ownerId: ownerId,
            })
            .sort({
                createdAt: -1,
            })
            .toArray();

        // Get property + tenant information
        const enrichedBookings = await Promise.all(
            bookings.map(async (booking) => {
                // Property information
                const property = await propertiesCollection.findOne({
                    _id: new ObjectId(booking.propertyId),
                });

                // Tenant information
                const tenant = await userCollection.findOne({
                    _id: new ObjectId(booking.tenantId),
                });

                return {
                    ...booking,

                    _id: booking._id.toString(),

                    property: property
                        ? {
                              _id: property._id.toString(),
                              title: property.title,
                              location: property.location,
                              city: property.city,
                              rent: property.rent,
                              image: property.image,
                          }
                        : null,

                    tenant: tenant
                        ? {
                              _id: tenant._id.toString(),
                              name: tenant.name,
                              email: tenant.email,
                              image: tenant.image,
                          }
                        : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            bookings: enrichedBookings,
        });
    } catch (error) {
        console.error(
            "Get owner bookings error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch rental requests",
        });
    }
});

// =========================
// APPROVE Booking
// =========================

app.patch("/api/bookings/:id/approve", async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "ownerId is required",
            });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID",
            });
        }

        // Find booking
        const booking = await bookingsCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Ownership check
        if (booking.ownerId !== ownerId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to approve this request",
            });
        }

        // Only pending booking can be approved
        if (booking.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This request is no longer pending",
            });
        }

        // Check property
        const property = await propertiesCollection.findOne({
            _id: new ObjectId(booking.propertyId),
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found",
            });
        }

        // Property must still be available
        if (property.status !== "available") {
            return res.status(400).json({
                success: false,
                message: "Property is no longer available",
            });
        }

        // Approve booking
        await bookingsCollection.updateOne(
            {
                _id: new ObjectId(id),
                ownerId: ownerId,
                status: "pending",
            },
            {
                $set: {
                    status: "accepted",
                    updatedAt: new Date(),
                },
            }
        );

        // Make property rented
        await propertiesCollection.updateOne(
            {
                _id: new ObjectId(booking.propertyId),
                status: "available",
            },
            {
                $set: {
                    status: "rented",
                    updatedAt: new Date(),
                },
            }
        );

        res.status(200).json({
            success: true,
            message: "Rental request approved successfully",
        });

    } catch (error) {
        console.error("Approve booking error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to approve rental request",
        });
    }
});

// =========================
// REJECT Booking
// =========================

app.patch("/api/bookings/:id/reject", async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "ownerId is required",
            });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID",
            });
        }

        const booking = await bookingsCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Ownership check
        if (booking.ownerId !== ownerId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to reject this request",
            });
        }

        // Only pending booking can be rejected
        if (booking.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This request is no longer pending",
            });
        }

        await bookingsCollection.updateOne(
            {
                _id: new ObjectId(id),
                ownerId: ownerId,
                status: "pending",
            },
            {
                $set: {
                    status: "rejected",
                    updatedAt: new Date(),
                },
            }
        );

        res.status(200).json({
            success: true,
            message: "Rental request rejected successfully",
        });

    } catch (error) {
        console.error("Reject booking error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to reject rental request",
        });
    }
});

// =========================
// UPDATE Booking Status
// =========================

app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId, status } = req.body;

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "ownerId is required",
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "status is required",
            });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking status",
            });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID",
            });
        }

        // Find booking
        const booking = await bookingsCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Only the property owner can update booking
        if (booking.ownerId !== ownerId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this booking",
            });
        }

        // Only pending booking can be updated
        if (booking.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This booking has already been processed",
            });
        }

        // =========================
        // ACCEPT BOOKING
        // =========================

        if (status === "accepted") {
            // Make sure property is still available
            const property = await propertiesCollection.findOne({
                _id: new ObjectId(booking.propertyId),
            });

            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found",
                });
            }

            if (property.status !== "available") {
                return res.status(400).json({
                    success: false,
                    message: "This property is no longer available",
                });
            }

            // Accept booking
            await bookingsCollection.updateOne(
                {
                    _id: new ObjectId(id),
                },
                {
                    $set: {
                        status: "accepted",
                        updatedAt: new Date(),
                    },
                }
            );

            // Make property rented
            await propertiesCollection.updateOne(
                {
                    _id: new ObjectId(booking.propertyId),
                },
                {
                    $set: {
                        status: "rented",
                        updatedAt: new Date(),
                    },
                }
            );

            // Reject other pending requests
            await bookingsCollection.updateMany(
                {
                    propertyId: booking.propertyId,
                    _id: {
                        $ne: new ObjectId(id),
                    },
                    status: "pending",
                },
                {
                    $set: {
                        status: "rejected",
                        updatedAt: new Date(),
                    },
                }
            );

            return res.status(200).json({
                success: true,
                message: "Booking accepted successfully",
            });
        }

        // =========================
        // REJECT BOOKING
        // =========================

        await bookingsCollection.updateOne(
            {
                _id: new ObjectId(id),
                ownerId: ownerId,
            },
            {
                $set: {
                    status: "rejected",
                    updatedAt: new Date(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
        });
    } catch (error) {
        console.error("Update booking status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update booking status",
        });
    }
});

// =========================
// GET Owner Statistics
// =========================

app.get("/api/owner/stats/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }

    // =========================
    // Property Statistics
    // =========================

    const totalProperties =
      await propertiesCollection.countDocuments({
        ownerId: ownerId,
      });

    const availableProperties =
      await propertiesCollection.countDocuments({
        ownerId: ownerId,
        status: "available",
      });

    const rentedProperties =
      await propertiesCollection.countDocuments({
        ownerId: ownerId,
        status: "rented",
      });

    // =========================
    // Booking Statistics
    // =========================

    const totalBookings =
      await bookingsCollection.countDocuments({
        ownerId: ownerId,
      });

    const pendingBookings =
      await bookingsCollection.countDocuments({
        ownerId: ownerId,
        status: "pending",
      });

    const acceptedBookings =
      await bookingsCollection.countDocuments({
        ownerId: ownerId,
        status: "accepted",
      });

    const rejectedBookings =
      await bookingsCollection.countDocuments({
        ownerId: ownerId,
        status: "rejected",
      });

    const cancelledBookings =
      await bookingsCollection.countDocuments({
        ownerId: ownerId,
        status: "cancelled",
      });

    res.status(200).json({
      success: true,

      stats: {
        totalProperties,
        availableProperties,
        rentedProperties,

        totalBookings,
        pendingBookings,
        acceptedBookings,
        rejectedBookings,
        cancelledBookings,
      },
    });
  } catch (error) {
    console.error(
      "Get owner stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch owner statistics",
    });
  }
});

// =========================
// GET Tenant Statistics
// =========================

app.get("/api/tenant/stats/:tenantId", async (req, res) => {
    try {
        const { tenantId } = req.params;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant ID is required",
            });
        }

        const totalBookings =
            await bookingsCollection.countDocuments({
                tenantId: tenantId,
            });

        const pendingBookings =
            await bookingsCollection.countDocuments({
                tenantId: tenantId,
                status: "pending",
            });

        const acceptedBookings =
            await bookingsCollection.countDocuments({
                tenantId: tenantId,
                status: "accepted",
            });

        const rejectedBookings =
            await bookingsCollection.countDocuments({
                tenantId: tenantId,
                status: "rejected",
            });

        const cancelledBookings =
            await bookingsCollection.countDocuments({
                tenantId: tenantId,
                status: "cancelled",
            });

        res.status(200).json({
            success: true,

            stats: {
                totalBookings,
                pendingBookings,
                acceptedBookings,
                rejectedBookings,
                cancelledBookings,
            },
        });
    } catch (error) {
        console.error(
            "Get tenant stats error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch tenant statistics",
        });
    }
});

// =========================
// GET All Users - Admin
// =========================

app.get("/api/users", async (req, res) => {
  try {
    const users = await userCollection
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    const formattedUsers = users.map((user) => ({
      ...user,
      _id: user._id.toString(),
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// =========================
// UPDATE User Role - Admin
// =========================

app.patch("/api/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    if (!["tenant", "owner", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const result = await userCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          role: role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "User role could not be updated",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Update user role error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
});

// =========================
// DELETE User - Admin
// =========================

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin user cannot be deleted",
      });
    }

    const result = await userCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "User could not be deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

// =========================
// GET All Properties - Admin
// =========================

app.get("/api/admin/properties", async (req, res) => {
  try {
    const properties = await propertiesCollection
      .find({})
      .sort({
        createdAt: -1,
      })
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
    console.error("Get admin properties error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
    });
  }
});
// =========================
// DELETE Property - Admin
// =========================

app.delete("/api/admin/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID",
      });
    }

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Property could not be deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete property error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete property",
    });
  }
});

// =========================
// GET ALL BOOKINGS - ADMIN
// =========================

app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await bookingsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const formattedBookings = await Promise.all(
            bookings.map(async (booking) => {
                const property = await propertiesCollection.findOne({
                    _id: new ObjectId(booking.propertyId),
                });

                return {
                    ...booking,

                    _id: booking._id.toString(),

                    property: property
                        ? {
                              _id: property._id.toString(),
                              title: property.title,
                              location: property.location,
                              city: property.city,
                              rent: property.rent,
                              image: property.image,
                          }
                        : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            bookings: formattedBookings,
        });
    } catch (error) {
        console.error("Get all bookings error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
        });
    }
});

// =========================
// GET Admin Statistics
// =========================

app.get("/api/admin/stats", async (req, res) => {
  try {
    // =========================
    // User Statistics
    // =========================

    const totalUsers = await userCollection.countDocuments();

    const totalOwners = await userCollection.countDocuments({
      role: "owner",
    });

    const totalTenants = await userCollection.countDocuments({
      role: "tenant",
    });

    const totalAdmins = await userCollection.countDocuments({
      role: "admin",
    });

    // =========================
    // Property Statistics
    // =========================

    const totalProperties =
      await propertiesCollection.countDocuments();

    const availableProperties =
      await propertiesCollection.countDocuments({
        status: "available",
      });

    const rentedProperties =
      await propertiesCollection.countDocuments({
        status: "rented",
      });

    // =========================
    // Booking Statistics
    // =========================

    const totalBookings =
      await bookingsCollection.countDocuments();

    const pendingBookings =
      await bookingsCollection.countDocuments({
        status: "pending",
      });

    const acceptedBookings =
      await bookingsCollection.countDocuments({
        status: "accepted",
      });

    const rejectedBookings =
      await bookingsCollection.countDocuments({
        status: "rejected",
      });

    const cancelledBookings =
      await bookingsCollection.countDocuments({
        status: "cancelled",
      });

    // =========================
    // Response
    // =========================

    res.status(200).json({
      success: true,

      stats: {
        totalUsers,
        totalOwners,
        totalTenants,
        totalAdmins,

        totalProperties,
        availableProperties,
        rentedProperties,

        totalBookings,
        pendingBookings,
        acceptedBookings,
        rejectedBookings,
        cancelledBookings,
      },
    });
  } catch (error) {
    console.error(
      "Get admin stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
    });
  }
});

// =========================
// GET Tenant Bookings
// =========================

app.get("/api/bookings/tenant/:tenantId", async (req, res) => {
    try {
        const { tenantId } = req.params;

        console.log("Tenant bookings:", tenantId);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant ID is required",
            });
        }

        const bookings = await bookingsCollection
            .find({
                tenantId: tenantId,
            })
            .sort({
                createdAt: -1,
            })
            .toArray();

        const enrichedBookings = await Promise.all(
            bookings.map(async (booking) => {
                // Property
                const property = await propertiesCollection.findOne({
                    _id: new ObjectId(booking.propertyId),
                });

                // Owner
                const owner = await userCollection.findOne({
                    _id: new ObjectId(booking.ownerId),
                });

                return {
                    ...booking,

                    _id: booking._id.toString(),

                    property: property
                        ? {
                              _id: property._id.toString(),
                              title: property.title,
                              location: property.location,
                              city: property.city,
                              rent: property.rent,
                              image: property.image,
                          }
                        : null,

                    owner: owner
                        ? {
                              _id: owner._id.toString(),
                              name: owner.name,
                              email: owner.email,
                              image: owner.image,
                          }
                        : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            bookings: enrichedBookings,
        });
    } catch (error) {
        console.error(
            "Get tenant bookings error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch tenant bookings",
        });
    }
});

// =========================
// CANCEL Booking
// =========================

app.patch("/api/bookings/:id/cancel", async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.body;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "tenantId is required",
            });
        }

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID",
            });
        }

        const booking = await bookingsCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Only booking owner can cancel
        if (booking.tenantId !== tenantId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to cancel this booking",
            });
        }

        // Only pending booking can be cancelled
        if (booking.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending bookings can be cancelled",
            });
        }

        const result = await bookingsCollection.updateOne(
            {
                _id: new ObjectId(id),
                tenantId: tenantId,
                status: "pending",
            },
            {
                $set: {
                    status: "cancelled",
                    updatedAt: new Date(),
                },
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Booking could not be cancelled",
            });
        }

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
        });
    } catch (error) {
        console.error("Cancel booking error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to cancel booking",
        });
    }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});