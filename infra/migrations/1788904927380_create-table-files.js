exports.up = (pgm) => {
  pgm.createTable("files", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    fileKey: {
      type: "varchar(255)",
      notNull: true,
    },

    createdAt: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },

    expires_at: {
      type: "timestamptz",
      default: pgm.func("NOW() + INTERVAL '1 day'"),
    },

    status: {
      type: "varchar(255)",
      notNull: true,
      default: "pending",
    },
  });
};

exports.down = () => null;
