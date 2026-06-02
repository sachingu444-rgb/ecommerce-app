const fs = require('fs');
const file = 'app/seller/dashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /const MetricCard = \(\{ label, value, sublabel, icon, color \}: MetricCardProps\) => \([\s\S]*?<\/LinearGradient>\n\);/;

const newCard = `const MetricCard = ({ label, value, sublabel, icon, color }: MetricCardProps) => (
  <View style={{ flex: 1, minWidth: 240 }}>
    <LinearGradient
      colors={[colors.white, \`\${color}0A\`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        panelStyle,
        {
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: \`\${color}20\`,
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: color,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 5,
        },
      ]}
    >
      <View style={{ position: 'absolute', right: -24, top: -24, opacity: 0.08 }}>
        <Ionicons name={icon} size={140} color={color} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: \`\${color}15\`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: \`\${color}30\`,
            }}
          >
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 38, fontWeight: '900', letterSpacing: -1.5 }}>
          {value}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xs }}>
          <View style={{ backgroundColor: \`\${colors.success}15\`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name='trending-up' size={14} color={colors.success} />
            <Text style={{ color: colors.success, fontSize: 12, fontWeight: '800' }}>Active</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{sublabel}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>
);`

if (regex.test(code)) {
  code = code.replace(regex, newCard);
  fs.writeFileSync(file, code);
  console.log('Successfully replaced MetricCard');
} else {
  console.error('Could not find MetricCard via regex');
}
