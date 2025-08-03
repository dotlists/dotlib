// src/components/LandingPage.tsx
import { SignIn } from "./auth/SignIn";
import { GanttChartSquare, Users, CheckSquare } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="p-4">
        <div className="container mx-auto flex items-center">
          <img src="/favicon.ico" alt="logo" className="h-8 w-8 mr-2" />
          <span className="font-bold text-xl font-heading">dotlists</span>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center text-center py-20">
          <h1 className="text-5xl md:text-7xl font-bold font-heading mb-4">
            organize your work, effortlessly.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
            a collaborative workspace to manage tasks, track progress, and bring
            your team together. get started in seconds.
          </p>
          
          <div className="w-full max-w-xs items-center justify-center flex">
            <SignIn />
          </div>
        </section>

        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold font-heading mb-12">
              everything you need to get work done
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center">
                <GanttChartSquare className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-2xl font-bold font-heading mb-2">
                  visual project planning
                </h3>
                <p className="text-muted-foreground">
                  plan and track your projects with our intuitive gantt charts.
                  visualize timelines, dependencies, and progress at a glance.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <CheckSquare className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-2xl font-bold font-heading mb-2">
                  detailed task management
                </h3>
                <p className="text-muted-foreground">
                  break down large tasks into manageable subtasks. track the
                  status of every detail to ensure nothing falls through the
                  cracks.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Users className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-2xl font-bold font-heading mb-2">
                  seamless collaboration
                </h3>
                <p className="text-muted-foreground">
                  work with your team in real-time. assign tasks, leave
                  comments, and get notifications to keep everyone in sync.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold font-heading mb-12">
              about us
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-muted-foreground mb-4">
                the original idea for dotlib came from us looking for team management tools, all of them required you to pay for basic features, which is hard to afford for small teams. we wanted to create a tool that is free, open source, and easy to use which could help teams of all sizes to manage their work effectively and simply. 
              </p>
              <p className="text-muted-foreground">
                our development team is composed of students who all met through VEX robotics, and we're passionate about building tools that make work easier and more enjoyable. we believe in the power of collaboration and open source, and we're excited to share dotlib with the world for free.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="p-4">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} dotlib. all rights reserved.
        </div>
      </footer>
    </div>
  );
}
