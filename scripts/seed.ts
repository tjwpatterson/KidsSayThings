import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seed() {
  console.log("Starting seed...")

  // Create a test user (you'll need to create this manually in Supabase Auth)
  // For now, we'll use a placeholder user_id
  const testUserId = process.env.TEST_USER_ID

  if (!testUserId) {
    console.error(
      "Please set TEST_USER_ID in .env.local to a valid user ID from Supabase Auth"
    )
    process.exit(1)
  }

  try {
    // Create household
    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({
        name: "The Sample Family",
        owner_id: testUserId,
      })
      .select()
      .single()

    if (householdError) throw householdError
    console.log("Created household:", household.id)

    // Add user as member
    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: household.id,
        user_id: testUserId,
        role: "owner",
      })

    if (memberError) throw memberError
    console.log("Added user as household member")

    // Create persons
    const persons = [
      { display_name: "Emma", birthdate: "2018-05-15" },
      { display_name: "Noah", birthdate: "2020-03-22" },
      { display_name: "Mom" },
    ]

    const createdPersons = []
    for (const person of persons) {
      const { data, error } = await supabase
        .from("persons")
        .insert({
          household_id: household.id,
          ...person,
        })
        .select()
        .single()

      if (error) throw error
      createdPersons.push(data)
      console.log(`Created person: ${data.display_name}`)
    }

    // Create entries across 2 months
    const entries = [
      {
        text: "I want to be a unicorn when I grow up!",
        person: "Emma",
        date: "2024-11-05",
        tags: ["funny", "dreams"],
        type: "quote",
      },
      {
        text: "Look, I can count to ten! One, two, three, four, five, six, seven, eight, nine, ten!",
        person: "Noah",
        date: "2024-11-10",
        tags: ["milestone", "learning"],
        type: "milestone",
      },
      {
        text: "Why is the sky blue? Because it's happy!",
        person: "Emma",
        date: "2024-11-15",
        tags: ["funny", "questions"],
        type: "quote",
      },
      {
        text: "First day of preschool - Noah was so brave!",
        person: "Noah",
        date: "2024-11-18",
        tags: ["milestone", "school"],
        type: "note",
      },
      {
        text: "I love you to the moon and back, Mommy!",
        person: "Emma",
        date: "2024-11-20",
        tags: ["sweet", "love"],
        type: "quote",
      },
      {
        text: "Noah learned to ride his bike today! So proud.",
        person: "Noah",
        date: "2024-11-25",
        tags: ["milestone", "proud"],
        type: "note",
      },
      {
        text: "Can we have pancakes for dinner? Please please please!",
        person: "Emma",
        date: "2024-12-01",
        tags: ["funny", "food"],
        type: "quote",
      },
      {
        text: "Noah's first lost tooth! The tooth fairy came!",
        person: "Noah",
        date: "2024-12-05",
        tags: ["milestone", "tooth"],
        type: "milestone",
      },
      {
        text: "I'm going to be a doctor and help people!",
        person: "Emma",
        date: "2024-12-10",
        tags: ["dreams", "future"],
        type: "quote",
      },
      {
        text: "Noah made a friend at the park today. They played together for hours!",
        person: "Noah",
        date: "2024-12-15",
        tags: ["friends", "play"],
        type: "note",
      },
      {
        text: "Why do we have to sleep? I'm not tired!",
        person: "Emma",
        date: "2024-12-18",
        tags: ["funny", "sleep"],
        type: "quote",
      },
      {
        text: "Emma read her first chapter book all by herself!",
        person: "Emma",
        date: "2024-12-20",
        tags: ["milestone", "reading"],
        type: "milestone",
      },
      {
        text: "I want to save all the animals in the world!",
        person: "Emma",
        date: "2024-12-22",
        tags: ["dreams", "animals"],
        type: "quote",
      },
      {
        text: "Noah helped set the table for dinner. So grown up!",
        person: "Noah",
        date: "2024-12-24",
        tags: ["proud", "helpful"],
        type: "note",
      },
      {
        text: "Best Christmas ever! The kids were so excited about their presents.",
        person: "Mom",
        date: "2024-12-25",
        tags: ["holiday", "memories"],
        type: "note",
      },
      {
        text: "Can I have a pet dinosaur? A small one?",
        person: "Emma",
        date: "2024-12-28",
        tags: ["funny", "pets"],
        type: "quote",
      },
      {
        text: "Noah's first soccer game! He scored a goal!",
        person: "Noah",
        date: "2024-12-30",
        tags: ["sports", "milestone"],
        type: "milestone",
      },
      {
        text: "I'm going to be the best big sister ever!",
        person: "Emma",
        date: "2024-12-31",
        tags: ["sweet", "family"],
        type: "quote",
      },
      {
        text: "New Year's resolution: capture more memories!",
        person: "Mom",
        date: "2025-01-01",
        tags: ["resolution", "memories"],
        type: "note",
      },
      {
        text: "Why is the grass green? Because it's happy to see us!",
        person: "Emma",
        date: "2025-01-05",
        tags: ["funny", "questions"],
        type: "quote",
      },
    ]

    for (const entry of entries) {
      const person = createdPersons.find((p) => p.display_name === entry.person)
      const { data: entryData, error: entryError } = await supabase
        .from("entries")
        .insert({
          household_id: household.id,
          said_by: person?.id || null,
          captured_by: testUserId,
          text: entry.text,
          entry_type: entry.type,
          source: "import",
          visibility: "household",
          entry_date: entry.date,
        })
        .select()
        .single()

      if (entryError) throw entryError

      // Add tags
      if (entry.tags.length > 0) {
        const tagInserts = entry.tags.map((tag) => ({
          entry_id: entryData.id,
          tag: tag.toLowerCase(),
        }))

        await supabase.from("entry_tags").insert(tagInserts)
      }

      console.log(`Created entry: ${entry.text.substring(0, 50)}...`)
    }

    console.log("Seed completed successfully!")
    console.log(`Household ID: ${household.id}`)
    console.log(`Created ${createdPersons.length} persons`)
    console.log(`Created ${entries.length} entries`)
  } catch (error: any) {
    console.error("Seed failed:", error)
    process.exit(1)
  }
}

seed()



