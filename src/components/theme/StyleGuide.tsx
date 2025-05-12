import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedTheme } from './UnifiedThemeProvider';

/**
 * StyleGuide component that showcases the global styling system
 * This component serves as both documentation and a visual reference
 */
export function StyleGuide() {
  const { theme, toggleTheme } = useUnifiedTheme();

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">OmniTrade Terminal Style Guide</h1>
        <p className="text-muted-foreground">
          This guide demonstrates the global styling system and component patterns.
          Current theme: <span className="font-medium">{theme}</span>
        </p>
        <Button onClick={toggleTheme} variant="outline" className="mt-2">
          Toggle Theme
        </Button>
      </div>

      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>
                Primary colors used throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorSwatch name="Background" className="bg-background" />
                <ColorSwatch name="Foreground" className="bg-foreground text-background" />
                <ColorSwatch name="Primary" className="bg-primary" />
                <ColorSwatch name="Secondary" className="bg-secondary" />
                <ColorSwatch name="Card" className="bg-card" />
                <ColorSwatch name="Muted" className="bg-muted" />
                <ColorSwatch name="Accent" className="bg-accent" />
                <ColorSwatch name="Destructive" className="bg-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crypto-Specific Colors</CardTitle>
              <CardDescription>
                Colors used for cryptocurrency data visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ColorSwatch name="Crypto Up" className="bg-crypto-up" />
                <ColorSwatch name="Crypto Down" className="bg-crypto-down" />
                <ColorSwatch name="Crypto Neutral" className="bg-crypto-neutral" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>
                Text sizes and weights used in the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">Heading 1 (text-4xl)</h1>
                <h2 className="text-3xl font-bold">Heading 2 (text-3xl)</h2>
                <h3 className="text-2xl font-bold">Heading 3 (text-2xl)</h3>
                <h4 className="text-xl font-semibold">Heading 4 (text-xl)</h4>
                <h5 className="text-lg font-semibold">Heading 5 (text-lg)</h5>
                <h6 className="text-base font-semibold">Heading 6 (text-base)</h6>
                <p className="text-base">Base text (text-base)</p>
                <p className="text-sm">Small text (text-sm)</p>
                <p className="text-xs">Extra small text (text-xs)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Text Styles</CardTitle>
              <CardDescription>
                Various text styles and colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-primary">Primary text</p>
              <p className="text-secondary-foreground">Secondary text</p>
              <p className="text-muted-foreground">Muted text</p>
              <p className="text-theme-link">Link text</p>
              <p className="text-theme-success">Success text</p>
              <p className="text-theme-error">Error text</p>
              <p className="text-theme-warning">Warning text</p>
              <p className="text-theme-info">Info text</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>
                Button variants and states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>
                Input fields and form controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-input">Default Input</Label>
                  <Input id="default-input" placeholder="Enter text..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled-input">Disabled Input</Label>
                  <Input id="disabled-input" placeholder="Disabled" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Component</CardTitle>
              <CardDescription>
                Example of a card with header, content, and footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is an example of card content. Cards are used throughout the application to group related information.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="utilities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Utilities</CardTitle>
              <CardDescription>
                Utility classes for applying theme variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-theme-primary rounded-md">bg-theme-primary</div>
                <div className="p-4 bg-theme-secondary rounded-md">bg-theme-secondary</div>
                <div className="p-4 bg-theme-tertiary rounded-md">bg-theme-tertiary</div>
                <div className="p-4 bg-theme-card rounded-md">bg-theme-card</div>
                <div className="p-4 text-theme-primary">text-theme-primary</div>
                <div className="p-4 text-theme-secondary">text-theme-secondary</div>
                <div className="p-4 border border-theme-primary rounded-md">border-theme-primary</div>
                <div className="p-4 border border-theme-focus rounded-md">border-theme-focus</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transition Utilities</CardTitle>
              <CardDescription>
                Classes for smooth theme transitions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-theme-primary rounded-md theme-transition-fast hover:bg-theme-secondary">
                  Fast Transition (hover me)
                </div>
                <div className="p-4 bg-theme-primary rounded-md theme-transition hover:bg-theme-secondary">
                  Normal Transition (hover me)
                </div>
                <div className="p-4 bg-theme-primary rounded-md theme-transition-slow hover:bg-theme-secondary">
                  Slow Transition (hover me)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for color swatches
function ColorSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-16 w-full rounded-md ${className}`} />
      <div className="text-sm font-medium">{name}</div>
    </div>
  );
}
