import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState, type ReactNode } from "react";
import {
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { buildResumeHtml, resumeData } from "../constants/resume";
import { colors, radius, shadows, spacing } from "../constants/theme";
import { showToast } from "../lib/toast";

const resumePalette = {
  accent: "#D6B25E",
  accentSoft: "#FFF4D8",
  blueSoft: "#EEF5FF",
  border: "#E0E6EF",
  card: "#FFFFFF",
  navy: "#13273F",
  page: "#EEF2F7",
  textSoft: "#6B7280",
} as const;

const sectionCardStyle = {
  backgroundColor: resumePalette.card,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: resumePalette.border,
  padding: spacing.xl,
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 24,
  elevation: 3,
} as const;

interface PrintFrameHandle {
  contentWindow: null | {
    focus: () => void;
    print: () => void;
  };
  onload: null | (() => void);
  remove: () => void;
  srcdoc: string;
  style: {
    border: string;
    height: string;
    pointerEvents: string;
    position: string;
    right: string;
    visibility: string;
    width: string;
  };
}

const openExternalLink = async (href?: string) => {
  if (!href) {
    return;
  }

  try {
    await Linking.openURL(href);
  } catch {
    showToast("error", "Link failed", "This link could not be opened right now.");
  }
};

const printHtmlOnWeb = async (html: string) => {
  const browserApi = globalThis as typeof globalThis & {
    document?: {
      body?: {
        appendChild: (node: unknown) => void;
      };
      createElement: (tagName: string) => PrintFrameHandle;
    };
  };

  if (!browserApi.document?.body || typeof browserApi.document.createElement !== "function") {
    throw new Error("print-window-unavailable");
  }

  const printFrame = browserApi.document.createElement("iframe");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  printFrame.style.visibility = "hidden";
  printFrame.style.pointerEvents = "none";
  printFrame.srcdoc = html;

  browserApi.document.body.appendChild(printFrame);

  await new Promise<void>((resolve, reject) => {
    let handled = false;

    const startPrint = () => {
      if (handled) {
        return;
      }

      handled = true;
      const frameWindow = printFrame.contentWindow;

      if (!frameWindow) {
        printFrame.remove();
        reject(new Error("print-frame-unavailable"));
        return;
      }

      frameWindow.focus();
      frameWindow.print();
      setTimeout(() => {
        printFrame.remove();
      }, 1000);
      resolve();
    };

    printFrame.onload = () => {
      setTimeout(startPrint, 250);
    };

    setTimeout(startPrint, 1200);
  });
};

const ResumeSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <View style={sectionCardStyle}>
    <Text
      style={{
        color: "#9A6F0B",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        marginBottom: spacing.lg,
      }}
    >
      {title}
    </Text>
    {children}
  </View>
);

export default function ResumeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [exporting, setExporting] = useState(false);

  const isDesktop = width >= 980;
  const isWideDesktop = width >= 1120;
  const html = useMemo(() => buildResumeHtml(resumeData), []);

  const handleDownloadPdf = async () => {
    try {
      setExporting(true);

      if (Platform.OS === "web") {
        await printHtmlOnWeb(html);
        showToast("success", "Print opened", "Choose Save as PDF in your browser to download it.");
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download resume PDF",
          UTI: "com.adobe.pdf",
        });
        showToast("success", "PDF ready", "Use Save or Files in the share sheet to keep your PDF.");
        return;
      }

      showToast("success", "PDF created", uri);
    } catch (error) {
      console.error("[resume] pdf export failed", error);
      const message =
        Platform.OS === "web" &&
        error instanceof Error &&
        error.message === "print-frame-unavailable"
          ? "The browser could not prepare the print frame. Refresh the page and try again."
          : "Please try again in a moment.";
      showToast("error", "PDF failed", message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: resumePalette.page }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient
          colors={["#0C1828", "#122841", "#18345A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xxl,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 1180,
              alignSelf: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: spacing.md,
                flexWrap: "wrap",
              }}
            >
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>

              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.sm,
                  flexWrap: "wrap",
                  justifyContent: isDesktop ? "flex-end" : "flex-start",
                }}
              >
                <Pressable
                  onPress={handleDownloadPdf}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.pill,
                    backgroundColor: resumePalette.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons name="download-outline" size={18} color="#081120" />
                  <Text style={{ color: "#081120", fontWeight: "900" }}>
                    {exporting ? "Preparing PDF..." : Platform.OS === "web" ? "Save as PDF" : "Download PDF"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openExternalLink("https://www.sachindia.online/")}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.pill,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.16)",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons name="globe-outline" size={18} color={colors.white} />
                  <Text style={{ color: colors.white, fontWeight: "800" }}>Visit Website</Text>
                </Pressable>
              </View>
            </View>

            <View
              style={{
                marginTop: spacing.lg,
                flexDirection: isDesktop ? "row" : "column",
                alignItems: "flex-start",
                gap: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 62,
                  height: 54,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: resumePalette.accent,
                }}
              >
                <Text style={{ color: "#081120", fontSize: 24, fontWeight: "900" }}>
                  {resumeData.initials}
                </Text>
              </View>

              <View style={{ flex: 1, maxWidth: isDesktop ? 820 : undefined }}>
                <Text style={{ color: colors.white, fontSize: 30, fontWeight: "900" }}>
                  {resumeData.name}
                </Text>
                <Text
                  style={{
                    color: "#F0C96A",
                    fontSize: 11,
                    fontWeight: "900",
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                    marginTop: 6,
                  }}
                >
                  {resumeData.title}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    marginTop: spacing.md,
                    lineHeight: 22,
                    maxWidth: 780,
                    fontSize: 14,
                  }}
                >
                  {resumeData.summary}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View
          style={{
            width: "100%",
            maxWidth: 1180,
            alignSelf: "center",
            paddingHorizontal: spacing.lg,
            marginTop: -18,
          }}
        >
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              alignItems: "flex-start",
              gap: spacing.lg,
            }}
          >
            <View style={{ width: isDesktop ? 300 : "100%", gap: spacing.lg }}>
              <ResumeSection title="Contact">
                <View style={{ gap: spacing.md }}>
                  {resumeData.contacts.map((item) => {
                    const clickable = Boolean(item.href);

                    return (
                      <Pressable
                        key={item.label}
                        disabled={!clickable}
                        onPress={() => openExternalLink(item.href)}
                        style={{
                          borderRadius: radius.lg,
                          padding: spacing.md,
                          backgroundColor: "#FAFCFF",
                          borderWidth: 1,
                          borderColor: clickable ? "#D9E6F7" : resumePalette.border,
                        }}
                      >
                        <Text
                          style={{
                            color: resumePalette.textSoft,
                            fontSize: 11,
                            fontWeight: "800",
                            letterSpacing: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={{
                            color: "#0F172A",
                            marginTop: spacing.xs,
                            fontSize: 15,
                            fontWeight: "800",
                          }}
                        >
                          {item.value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ResumeSection>

              <ResumeSection title="Skills">
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {resumeData.skills.map((skill) => (
                    <View
                      key={skill}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: 7,
                        borderRadius: radius.pill,
                        backgroundColor: resumePalette.accentSoft,
                        borderWidth: 1,
                        borderColor: "#E8CC82",
                      }}
                    >
                      <Text style={{ color: "#8A6200", fontWeight: "800", fontSize: 12 }}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </ResumeSection>

              <ResumeSection title="Education">
                <View style={{ gap: spacing.lg }}>
                  {resumeData.education.map((item) => (
                    <View key={`${item.degree}-${item.field}`}>
                      {item.period ? (
                        <Text
                          style={{
                            color: colors.muted,
                            fontSize: 11,
                            fontWeight: "800",
                            letterSpacing: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.period}
                        </Text>
                      ) : null}
                      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900", marginTop: spacing.xs }}>
                        {item.degree}
                      </Text>
                      <Text style={{ color: colors.muted, marginTop: 2 }}>{item.field}</Text>
                    </View>
                  ))}
                </View>
              </ResumeSection>
            </View>

            <View style={{ flex: 1, width: "100%", gap: spacing.lg }}>
              <View
                style={{
                  flexDirection: isWideDesktop ? "row" : "column",
                  alignItems: "stretch",
                  gap: spacing.lg,
                }}
              >
                <View style={{ flex: isWideDesktop ? 0.85 : undefined }}>
                  <ResumeSection title="Profile">
                    <Text style={{ color: colors.text, lineHeight: 25, fontSize: 15 }}>
                      {resumeData.summary}
                    </Text>
                  </ResumeSection>
                </View>

                <View style={{ flex: 1 }}>
                  <ResumeSection title="Projects">
                    <View style={{ gap: spacing.lg }}>
                      {resumeData.projects.map((project) => (
                        <View
                          key={project.name}
                          style={{
                            borderRadius: radius.xl,
                            padding: spacing.xl,
                            backgroundColor: "#FBFCFE",
                            borderWidth: 1,
                            borderColor: "#E3E8F0",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: spacing.md,
                              flexWrap: "wrap",
                            }}
                          >
                            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900", flex: 1 }}>
                              {project.name}
                            </Text>

                            {project.url ? (
                              <Pressable
                                onPress={() => openExternalLink(project.url)}
                                style={{
                                  paddingHorizontal: spacing.md,
                                  paddingVertical: spacing.sm,
                                  borderRadius: radius.pill,
                                  backgroundColor: colors.primaryLight,
                                }}
                              >
                                <Text style={{ color: colors.primary, fontWeight: "800" }}>Open project</Text>
                              </Pressable>
                            ) : null}
                          </View>

                          <Text style={{ color: colors.muted, lineHeight: 23, marginTop: spacing.md }}>
                            {project.description}
                          </Text>

                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg }}>
                            {project.technologies.map((technology) => (
                              <View
                                key={technology}
                                style={{
                                  paddingHorizontal: spacing.md,
                                  paddingVertical: spacing.sm,
                                  borderRadius: radius.pill,
                                  backgroundColor: resumePalette.blueSoft,
                                }}
                              >
                                <Text style={{ color: colors.primaryDark, fontWeight: "800", fontSize: 12 }}>
                                  {technology}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  </ResumeSection>
                </View>
              </View>

              <ResumeSection title="Work Experience">
                <View style={{ gap: spacing.xl }}>
                  {resumeData.experience.map((job, index) => (
                    <View
                      key={`${job.company}-${job.period}`}
                      style={{
                        flexDirection: "row",
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ alignItems: "center", width: 20 }}>
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            backgroundColor: "#D6B25E",
                            marginTop: 8,
                          }}
                        />
                        {index !== resumeData.experience.length - 1 ? (
                          <View
                            style={{
                              width: 2,
                              flex: 1,
                              backgroundColor: "#E7D4A4",
                              marginTop: spacing.sm,
                              minHeight: 90,
                            }}
                          />
                        ) : null}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: spacing.md,
                            flexWrap: "wrap",
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                              {job.company}
                            </Text>
                            <Text style={{ color: colors.muted, marginTop: 4 }}>{job.location}</Text>
                          </View>

                          <View
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: radius.pill,
                              backgroundColor: "#FFF3D8",
                            }}
                          >
                            <Text style={{ color: "#8A6200", fontWeight: "900", fontSize: 12 }}>
                              {job.period}
                            </Text>
                          </View>
                        </View>

                        <Text style={{ color: colors.primaryDark, marginTop: spacing.sm, fontWeight: "800" }}>
                          {job.role}
                        </Text>

                        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                          {job.responsibilities.map((responsibility) => (
                            <View
                              key={responsibility}
                              style={{
                                flexDirection: "row",
                                alignItems: "flex-start",
                                gap: spacing.sm,
                              }}
                            >
                              <Text style={{ color: "#C79010", fontSize: 18, lineHeight: 20 }}>•</Text>
                              <Text style={{ color: colors.muted, flex: 1, lineHeight: 22 }}>
                                {responsibility}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ResumeSection>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
