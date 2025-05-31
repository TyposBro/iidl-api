const mongoose = require("mongoose");

const metaSchema = new mongoose.Schema(
  {
    pageIdentifier: {
      // e.g., "home", "footer", "projects", "publications"
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      // SEO Title, or Page Title
      type: String,
    },
    description: {
      // SEO Description, or Page Subtitle/Description
      type: String,
    },
    // --- Home Page Specific Fields ---
    homeYoutubeId: {
      type: String, // For the YouTube video ID on the home page
    },
    // --- Footer Specific Fields ---
    footerAddress: {
      type: String,
    },
    footerAddressLink: {
      // URL for the map link
      type: String,
    },
    footerPhone: {
      type: String,
    },
    footerEmail: {
      type: String,
    },
    footerHeadline: {
      // e.g., "Contact Us"
      type: String,
    },
    footerSubtext: {
      // e.g., "If you have any inquiries..."
      type: String,
    },
    // Add other fields as needed for other pages
    // For example, for publications page:
    // publicationsPageSubtitle: String,
  },
  { timestamps: true, strict: false } // strict: false allows adding fields later without schema migration
);

const Meta = mongoose.model("Meta", metaSchema);

module.exports = Meta;
