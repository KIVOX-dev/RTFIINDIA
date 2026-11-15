import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const Admin = model('Admin', new Schema({ email: { type: String, unique: true, lowercase: true }, passwordHash: String }, { timestamps: true }));

const rowSchema = new Schema(
  { item: { type: String, required: true, maxlength: 120 }, unit: { type: String, default: '', maxlength: 30 },
    rate: { type: Number, default: null }, prev: { type: Number, default: null }, note: { type: String, default: '', maxlength: 200 } },
  { _id: false });
const priceSchema = new Schema(
  { type: { type: String, enum: ['yarn', 'cai'], required: true }, date: { type: String, required: true }, // YYYY-MM-DD (IST)
    rows: [rowSchema], poster: { type: String, default: '' }, posterName: { type: String, default: '' } },
  { timestamps: true });
priceSchema.index({ type: 1, date: -1 }, { unique: true });
const PriceList = model('PriceList', priceSchema);

const postSchema = new Schema(
  { kind: { type: String, enum: ['news', 'blog', 'event'], default: 'news', index: true },
    title: { type: String, required: true, maxlength: 120 }, slug: { type: String, unique: true },
    summary: { type: String, default: '', maxlength: 400 }, body: { type: String, default: '' },
    category: { type: String, default: '', index: true }, pinned: { type: Boolean, default: false, index: true },
    hidden: { type: Boolean, default: false }, imageUrl: { type: String, default: '' }, imageAlt: { type: String, default: '' },
    linkUrl: { type: String, default: '' }, attachmentUrl: { type: String, default: '' },
    publishAt: { type: Date, default: Date.now, index: true }, eventDate: { type: String, default: '' },
    views: { type: Number, default: 0 } },
  { timestamps: true });
postSchema.index({ kind: 1, pinned: -1, publishAt: -1 });
const Post = model('Post', postSchema);

const GalleryItem = model('GalleryItem', new Schema(
  { imageUrl: { type: String, required: true }, alt: { type: String, default: '' }, caption: { type: String, default: '' },
    category: { type: String, default: 'gallery', index: true }, order: { type: Number, default: 0 },
    w: { type: Number, default: 0 }, h: { type: Number, default: 0 } }, { timestamps: true }));

const Award = model('Award', new Schema(
  { year: { type: Number, required: true, index: true }, title: { type: String, default: '' }, imageUrl: { type: String, default: '' },
    alt: { type: String, default: '' }, order: { type: Number, default: 0 } }, { timestamps: true }));

const Member = model('Member', new Schema(
  { group: { type: String, enum: ['office', 'zonal', 'management'], required: true, index: true },
    name: { type: String, required: true }, role: { type: String, default: '' }, firm: { type: String, default: '' },
    photoUrl: { type: String, default: '' }, linkedin: { type: String, default: '' }, order: { type: Number, default: 0 } }, { timestamps: true }));

const Setting = model('Setting', new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed }, { timestamps: true }));

const ReferenceChart = model('ReferenceChart', new Schema(
  { title: { type: String, required: true }, category: { type: String, required: true, index: true },
    fileUrl: { type: String, default: '' }, isPdf: { type: Boolean, default: false }, alt: { type: String, default: '' },
    table: { type: [[String]], default: undefined }, date: { type: String, required: true } }, { timestamps: true }));

const Message = model('Message', new Schema(
  { name: String, phone: String, mill: { type: String, default: '' }, message: String, read: { type: Boolean, default: false }, ip: String },
  { timestamps: true }));

export { Admin, PriceList, Post, GalleryItem, Award, Member, Setting, ReferenceChart, Message };
