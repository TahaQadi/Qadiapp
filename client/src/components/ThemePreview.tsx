
import { Card } from "./ui/card";
import { useLanguage } from "./LanguageProvider";

export function ThemePreview() {
  const { t } = useLanguage();

  const colorTokens = [
    { name: "Background", var: "--background", description: "Main background color" },
    { name: "Foreground", var: "--foreground", description: "Main text color" },
    { name: "Card", var: "--card", description: "Card background" },
    { name: "Card Foreground", var: "--card-foreground", description: "Card text" },
    { name: "Popover", var: "--popover", description: "Popover background" },
    { name: "Primary", var: "--primary", description: "Primary brand color" },
    { name: "Primary Foreground", var: "--primary-foreground", description: "Text on primary" },
    { name: "Secondary", var: "--secondary", description: "Secondary color" },
    { name: "Muted", var: "--muted", description: "Muted backgrounds" },
    { name: "Accent", var: "--accent", description: "Accent color" },
    { name: "Destructive", var: "--destructive", description: "Error/delete color" },
    { name: "Border", var: "--border", description: "Border color" },
    { name: "Input", var: "--input", description: "Input border" },
    { name: "Ring", var: "--ring", description: "Focus ring" },
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Theme Color Tokens</h2>
        <p className="text-muted-foreground mb-6">
          All color tokens used throughout the application. These automatically switch between light and dark modes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colorTokens.map((token) => (
          <Card key={token.var} className="p-4">
            <div className="space-y-3">
              <div
                className="h-20 rounded-md border"
                style={{ backgroundColor: `hsl(var(${token.var}))` }}
              />
              <div>
                <h3 className="font-medium">{token.name}</h3>
                <code className="text-xs text-muted-foreground">{token.var}</code>
                <p className="text-sm text-muted-foreground mt-1">{token.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 mt-8">Typography Scale</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Heading 1 - 36px Bold</h1>
            <code className="text-xs text-muted-foreground">text-4xl font-bold</code>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Heading 2 - 30px Bold</h2>
            <code className="text-xs text-muted-foreground">text-3xl font-bold</code>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Heading 3 - 24px Bold</h3>
            <code className="text-xs text-muted-foreground">text-2xl font-bold</code>
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-semibold">Heading 4 - 20px Semibold</h4>
            <code className="text-xs text-muted-foreground">text-xl font-semibold</code>
          </div>
          <div className="space-y-2">
            <p className="text-base">Body Text - 16px Regular</p>
            <code className="text-xs text-muted-foreground">text-base</code>
          </div>
          <div className="space-y-2">
            <p className="text-sm">Small Text - 14px Regular</p>
            <code className="text-xs text-muted-foreground">text-sm</code>
          </div>
          <div className="space-y-2">
            <p className="text-xs">Caption - 12px Regular</p>
            <code className="text-xs text-muted-foreground">text-xs</code>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 mt-8">Spacing System</h2>
        <p className="text-muted-foreground mb-4">Base unit: 4px (0.25rem)</p>
        <div className="space-y-3">
          {[1, 2, 3, 4, 6, 8, 12, 16, 24, 32].map((value) => (
            <div key={value} className="flex items-center gap-4">
              <code className="w-20 text-sm">space-{value}</code>
              <div
                className="h-8 bg-primary rounded"
                style={{ width: `${value * 4}px` }}
              />
              <span className="text-sm text-muted-foreground">{value * 4}px</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 mt-8">Mobile Touch Targets</h2>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-2">
              <h3 className="font-medium">Minimum Size: 44x44px</h3>
              <div className="flex gap-4 items-center">
                <div className="w-11 h-11 bg-primary rounded flex items-center justify-center text-primary-foreground">
                  44px
                </div>
                <p className="text-sm text-muted-foreground">All interactive elements meet this minimum</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
