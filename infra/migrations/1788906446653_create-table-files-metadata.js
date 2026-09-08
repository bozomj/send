exports.up = (pgm) => {
  pgm.createTable("files_metadata", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    file_id: {
      type: "integer",
      notNull: true,
      unique: true,
      references: '"files"(id)',
      onDelete: "CASCADE",
    },

    ip_address: {
      type: "inet",
      notNull: true,
    },

    user_agent: {
      type: "text",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};
