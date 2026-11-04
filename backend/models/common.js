/** Keep the string IDs/timestamps used by the uploaded ChefKart project.
 * The small Student lab uses normal MongoDB ObjectIds instead.
 */
export const recordFields = {
  _id: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
};
export const schemaOptions = { versionKey: false, strict: "throw" };
