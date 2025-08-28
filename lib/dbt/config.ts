/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

export const DBT_ENABLED = process.env.DBT_ENABLED === "true";
export const DBT_VERDICT_ENFORCE = process.env.DBT_VERDICT_ENFORCE === "true";
export const DBT_CAP_TEMPORAL = Number(process.env.DBT_CAP_TEMPORAL ?? 2.0);
export const DBT_WL = Number(process.env.DBT_WL ?? 0.6);
export const DBT_WT = Number(process.env.DBT_WT ?? 0.4);
export const DBT_REJECT_THRESHOLD = Number(process.env.DBT_REJECT_THRESHOLD ?? 0.85);