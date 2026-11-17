import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, type } = await req.json()
    
    console.log(`[scheduler] Processing task breakdown for: ${title} (${type})`)

    let tasks = [];

    if (type === 'essay' || type === 'report') {
      tasks = [
        { title: "Initial Research & Reading", description: "Gather primary sources and take initial notes.", estimated_hours: 4, difficulty: "hard" },
        { title: "Detailed Outline", description: "Structure the arguments and map out sections.", estimated_hours: 2, difficulty: "medium" },
        { title: "First Draft - Core Arguments", description: "Write the main body of the assignment.", estimated_hours: 6, difficulty: "hard" },
        { title: "Introduction & Conclusion", description: "Draft the opening and closing sections.", estimated_hours: 2, difficulty: "medium" },
        { title: "Editing & Citations", description: "Refine language and ensure correct referencing.", estimated_hours: 3, difficulty: "medium" },
        { title: "Final Proofread", description: "Check for spelling and formatting consistency.", estimated_hours: 1, difficulty: "easy" }
      ];
    } else if (type === 'programming') {
      tasks = [
        { title: "Requirements Analysis", description: "Break down technical requirements.", estimated_hours: 3, difficulty: "medium" },
        { title: "Environment Setup", description: "Set up development environment and boilerplate.", estimated_hours: 2, difficulty: "easy" },
        { title: "Core Feature Implementation", description: "Develop primary functionality.", estimated_hours: 8, difficulty: "hard" },
        { title: "Testing & Debugging", description: "Write unit tests and fix bugs.", estimated_hours: 4, difficulty: "hard" },
        { title: "Documentation", description: "Write README and technical docs.", estimated_hours: 2, difficulty: "easy" }
      ];
    } else if (type === 'presentation') {
      tasks = [
        { title: "Content Research", description: "Gather data and visual assets.", estimated_hours: 3, difficulty: "medium" },
        { title: "Slide Deck Structure", description: "Create outline and layout for slides.", estimated_hours: 2, difficulty: "easy" },
        { title: "Visual Design", description: "Refine aesthetics and data visualization.", estimated_hours: 3, difficulty: "medium" },
        { title: "Script & Speaker Notes", description: "Write the accompanying script.", estimated_hours: 2, difficulty: "medium" },
        { title: "Rehearsal", description: "Practice delivery and timing.", estimated_hours: 2, difficulty: "hard" }
      ];
    } else {
      tasks = [
        { title: "Project Kickoff", description: "Review brief and define scope.", estimated_hours: 2, difficulty: "easy" },
        { title: "Phase 1: Preparation", description: "Gather materials and info.", estimated_hours: 4, difficulty: "medium" },
        { title: "Phase 2: Execution", description: "Perform primary work.", estimated_hours: 6, difficulty: "hard" },
        { title: "Phase 3: Review", description: "Evaluate against criteria.", estimated_hours: 3, difficulty: "medium" },
        { title: "Final Submission Prep", description: "Prepare final files.", estimated_hours: 1, difficulty: "easy" }
      ];
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    return new Response(
      JSON.stringify({ tasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("[scheduler] Runtime Error:", error.message)
    return new Response(
      JSON.stringify({ error: `Internal Error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})