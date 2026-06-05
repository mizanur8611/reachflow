// prisma/seedSubscriptionPlans.js
// Run: node prisma/seedSubscriptionPlans.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding subscription plans...')

  // ── Delete existing plans ──
  await prisma.subscriptionPlan.deleteMany({})

  // ── Advertiser Plans ──
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Basic',
        type: 'ADVERTISER',
        price: 0,
        campaignLimit: 3,
        maxPromotersPerCamp: 10,
        analyticsExport: false,
        prioritySupport: false,
        platformFeePercent: 15,
      },
      {
        name: 'Pro',
        type: 'ADVERTISER',
        price: 20,
        campaignLimit: 20,
        maxPromotersPerCamp: 50,
        analyticsExport: true,
        prioritySupport: false,
        platformFeePercent: 10,
      },
      {
        name: 'Enterprise',
        type: 'ADVERTISER',
        price: 70,
        campaignLimit: null,       // unlimited
        maxPromotersPerCamp: null, // unlimited
        analyticsExport: true,
        prioritySupport: true,
        platformFeePercent: 5,
      },
    ],
  })

  // ── Promoter Plans ──
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: 'Basic',
        type: 'PROMOTER',
        price: 0,
        maxCampaignApply: 5,
        analyticsExport: false,
        priorityApplications: false,
        verifiedBadge: false,
        platformFeePercent: 10,
      },
      {
        name: 'Pro',
        type: 'PROMOTER',
        price: 7,
        maxCampaignApply: null, // unlimited
        analyticsExport: true,
        priorityApplications: true,
        verifiedBadge: true,
        platformFeePercent: 7,
      },
      {
        name: 'Enterprise',
        type: 'PROMOTER',
        price: 25,
        maxCampaignApply: null, // unlimited
        analyticsExport: true,
        priorityApplications: true,
        verifiedBadge: true,
        platformFeePercent: 5,
      },
    ],
  })

  console.log('✅ Subscription plans seeded!')
  const plans = await prisma.subscriptionPlan.findMany()
  plans.forEach(p => console.log(`  ${p.type} - ${p.name}: $${p.price}/mo`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
