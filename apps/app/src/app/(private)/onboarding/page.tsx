"use client";

import {
  ChevronLeftIcon,
  Chrome,
  Dice5,
  Eye,
  LayoutGrid,
  Leaf,
  Lock,
  LucideIcon,
  Puzzle,
  Shield,
  Sparkles,
  Star,
  User,
  Workflow,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IconListItem {
  icon: LucideIcon;
  title: string;
}

interface StepDef {
  title: string;
  description: string | IconListItem[];
  className?: string;
  isBlocking?: boolean;
  stepLabel?: string;
  component: React.ComponentType<StepComponentProps>;
  secondaryCta?: React.ComponentType;
  cta?: React.ComponentType<StepCtaProps>;
}

const Background = () => {
  return (
    <div className="flex h-dvh w-full items-start">
      <div className="h-full w-64 shrink-0 border-r">
        <div className="flex h-14 w-full items-center border-b p-4">
          <img
            src="/images/logo.svg"
            className="w-40 dark:invert"
            alt="Lifely logo"
          />
        </div>
        <ul className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => {
            return (
              <li
                key={`dummy-link-${index}`}
                className="block h-8 w-50 rounded-md bg-muted"
              />
            );
          })}
        </ul>
      </div>
      <div className="flex h-14 w-full items-center border-b p-4">
        <span className="block h-8 w-full max-w-50 rounded-md bg-muted" />
      </div>
    </div>
  );
};

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  showOnlyFirst?: number;
}

const StepIndicator = ({ totalSteps, currentStep, showOnlyFirst }: StepIndicatorProps) => {
  const stepsToShow = showOnlyFirst !== undefined ? showOnlyFirst : totalSteps;
  
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: stepsToShow }).map((_, i) => {
        return (
          <span
            key={`step-indicator-${i}`}
            className={cn(
              "block size-2 rounded-full transition-colors",
              currentStep >= i ? "bg-primary" : "border bg-muted",
            )}
          />
        );
      })}
    </div>
  );
};

interface FadeContainerProps {
  children: React.ReactNode;
  condition: boolean;
  className?: string;
}

const FadeContainer = ({
  children,
  condition,
  className,
}: FadeContainerProps) => {
  const fadeVariants = {
    initial: {
      opacity: 0,
      filter: "blur(4px)",
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      filter: "blur(4px)",
    },
  };

  return (
    <AnimatePresence mode="popLayout">
      {condition && (
        <motion.div
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface StepDescriptionCardProps {
  title: string;
  description: string | IconListItem[];
  stepLabel?: string;
}

const StepDescriptionCard = ({
  title,
  description,
  stepLabel,
}: StepDescriptionCardProps) => {
  return (
    <div className="space-y-2 md:space-y-4">
      {stepLabel ? (
        <p className="text-sm font-semibold text-primary">{stepLabel}</p>
      ) : null}
      <h3 className="text-xl font-semibold md:text-4xl">{title}</h3>
      <div className="text-sm leading-tight text-muted-foreground md:text-base">
        {typeof description === "string" ? (
          <p>{description}</p>
        ) : (
          <ul className="space-y-4">
            {description?.map((item, i) => {
              return (
                <li key={`step-${i}`} className="flex items-center gap-2">
                  <item.icon className="size-4 shrink-0" />
                  <p>{item.title}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

interface OnboardingData {
  step1: {
    role: "member" | "mentor" | "";
  };
  step2: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  step3: {
    password: string;
    confirmPassword: string;
    acceptedTerms: boolean;
  };
  personalizeStep2?: {
    gender: string;
    pronouns: string;
    ethnicity: string;
    photoDataUrl?: string;
  };
}

const STORAGE_KEY = "onboarding_data";

const loadOnboardingData = (): Partial<OnboardingData> => {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveOnboardingData = (data: Partial<OnboardingData>) => {
  if (typeof window === "undefined") return;
  try {
    const existing = loadOnboardingData();
    const updated = { ...existing, ...data };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

interface StepComponentProps {
  stepIndex: number;
  onValidationChange: (stepIndex: number, isValid: boolean) => void;
  data?: Partial<OnboardingData>;
  onDataChange?: (step: keyof OnboardingData, data: Partial<OnboardingData[keyof OnboardingData]>) => void;
}

interface StepCtaProps {
  onClick: () => void;
  disabled?: boolean;
}

const StepOneComponent = ({ stepIndex, onValidationChange, data, onDataChange }: StepComponentProps) => {
  const [role, setRole] = useState<"member" | "mentor" | "">(data?.step1?.role || "");

  // Валидация при монтировании и изменении роли
  useEffect(() => {
    if (role) {
      onValidationChange(stepIndex, true);
    } else {
      onValidationChange(stepIndex, false);
    }
  }, [role, stepIndex, onValidationChange]);

  useEffect(() => {
    if (data?.step1?.role && data.step1.role !== role) {
      setRole(data.step1.role);
    }
  }, [data?.step1?.role, role]);

  const handleSelectRole = (value: "member" | "mentor") => {
    setRole(value);
    onDataChange?.("step1", { role: value });
    onValidationChange(stepIndex, true);
  };

  const handleCancel = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="w-full max-w-xl space-y-3 md:min-h-[40.5dvh]">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Are you signing up as a
        </p>
      </div>

      <div className="space-y-3">
        <label
          className={cn(
            "flex cursor-pointer gap-3 rounded-lg border bg-background px-3 py-2 transition-colors",
            role === "member"
              ? "border-primary ring-2 ring-primary/60"
              : "border-border hover:bg-muted",
          )}
        >
          <input
            type="radio"
            name="onboarding-role"
            className="mt-1 h-4 w-4 border-muted-foreground accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            checked={role === "member"}
            onChange={() => handleSelectRole("member")}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Member</p>
            <p className="text-xs text-muted-foreground md:text-sm">
              I am looking to get help & info from others to live a healthier life
            </p>
          </div>
        </label>

        <label
          className={cn(
            "flex cursor-pointer gap-3 rounded-lg border bg-background px-3 py-2 transition-colors",
            role === "mentor"
              ? "border-primary ring-2 ring-primary/60"
              : "border-border hover:bg-muted",
          )}
        >
          <input
            type="radio"
            name="onboarding-role"
            className="mt-1 h-4 w-4 border-muted-foreground accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            checked={role === "mentor"}
            onChange={() => handleSelectRole("mentor")}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Mentor</p>
            <p className="text-xs text-muted-foreground md:text-sm">
              I want to give advice & tips to others about healthy living
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

const StepTwoComponent = ({ stepIndex, onValidationChange, data, onDataChange }: StepComponentProps) => {
  const isMountedRef = useRef(false);
  const [firstName, setFirstName] = useState(() => data?.step2?.firstName || "");
  const [lastName, setLastName] = useState(() => data?.step2?.lastName || "");
  const [email, setEmail] = useState(() => data?.step2?.email || "");
  const [phone, setPhone] = useState(() => data?.step2?.phone || "");

  useEffect(() => {
    if (!isMountedRef.current && data?.step2) {
      setFirstName(data.step2.firstName || "");
      setLastName(data.step2.lastName || "");
      setEmail(data.step2.email || "");
      setPhone(data.step2.phone || "");
      isMountedRef.current = true;
    }
  }, [data?.step2]);

  const handleFieldChange = (field: string, value: string) => {
    if (field === "firstName") setFirstName(value);
    if (field === "lastName") setLastName(value);
    if (field === "email") setEmail(value);
    if (field === "phone") setPhone(value);
  };

  useEffect(() => {
    const isValid = firstName.trim() !== "" && lastName.trim() !== "" && email.trim() !== "" && phone.trim() !== "";
    onValidationChange(stepIndex, isValid);
    
    const updatedData = {
      firstName,
      lastName,
      email,
      phone,
    };
    onDataChange?.("step2", updatedData);
  }, [firstName, lastName, email, phone, stepIndex, onValidationChange, onDataChange]);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full max-w-xl flex-col gap-6"
    >
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> indicates a required field
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Your name</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="first-name">
              First name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first-name"
              name="firstName"
              className="bg-background"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="last-name">
              Last name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last-name"
              name="lastName"
              className="bg-background"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Your contact info</p>

        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              className="bg-background"
              autoComplete="email"
              value={email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We use your email to: log you into Lifely, send reminders, and deliver important
            communications
          </p>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              name="phone"
              className="bg-background"
              autoComplete="tel"
              value={phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter your phone number in ###-###-#### format. We use your phone number to help recover
            your account and send reminders according to your preferences.
          </p>
        </div>
      </div>
    </form>
  );
};

const getPasswordChecks = (value: string) => {
  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

  return { hasMinLength, hasUppercase, hasNumber, hasSpecial };
};

const StepThreeComponent = ({
  stepIndex,
  onValidationChange,
  data,
  onDataChange,
}: StepComponentProps) => {
  const isMountedRef = useRef(false);
  const [password, setPassword] = useState(() => data?.step3?.password || "");
  const [confirmPassword, setConfirmPassword] = useState(() => data?.step3?.confirmPassword || "");
  const [acceptedTerms, setAcceptedTerms] = useState(() => data?.step3?.acceptedTerms || false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isMountedRef.current && data?.step3) {
      const savedPassword = data.step3.password || "";
      const savedConfirmPassword = data.step3.confirmPassword || "";
      const savedAcceptedTerms = data.step3.acceptedTerms || false;
      setPassword(savedPassword);
      setConfirmPassword(savedConfirmPassword);
      setAcceptedTerms(savedAcceptedTerms);
      isMountedRef.current = true;
    }
  }, [data?.step3]);

  useEffect(() => {
    // Выполняем валидацию при каждом изменении полей
    const checks = getPasswordChecks(password);
    const isValid =
      password.length > 0 &&
      confirmPassword.length > 0 &&
      checks.hasMinLength &&
      checks.hasUppercase &&
      checks.hasNumber &&
      checks.hasSpecial &&
      password === confirmPassword &&
      acceptedTerms;
    
    // Важно: вызываем onValidationChange с правильным stepIndex
    onValidationChange(stepIndex, isValid);
    
    const updatedData = {
      password,
      confirmPassword,
      acceptedTerms,
    };
    onDataChange?.("step3", updatedData);
  }, [password, confirmPassword, acceptedTerms, stepIndex, onValidationChange, onDataChange]);

  // Дополнительная валидация при монтировании, если данные уже заполнены
  useEffect(() => {
    if (password && confirmPassword && acceptedTerms) {
      const checks = getPasswordChecks(password);
      const isValid =
        checks.hasMinLength &&
        checks.hasUppercase &&
        checks.hasNumber &&
        checks.hasSpecial &&
        password === confirmPassword &&
        acceptedTerms;
      onValidationChange(stepIndex, isValid);
    }
  }, [stepIndex, onValidationChange]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleAcceptTermsChange = (checked: boolean | "indeterminate") => {
    setAcceptedTerms(checked === true);
  };


  const generatePassword = () => {
    const length = 12;
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";
    const specialChars = "!@#$%^&*()_+-={}[];:,.<>?";

    let result = "";
    result += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    result += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    result += numberChars[Math.floor(Math.random() * numberChars.length)];
    result += specialChars[Math.floor(Math.random() * specialChars.length)];

    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    for (let i = result.length; i < length; i++) {
      result += allChars[Math.floor(Math.random() * allChars.length)];
    }

    let shuffled = result
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    // Ensure at least one special character is present after shuffling
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(shuffled)) {
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      const replacement =
        specialChars[Math.floor(Math.random() * specialChars.length)];
      shuffled =
        shuffled.slice(0, randomIndex) + replacement + shuffled.slice(randomIndex + 1);
    }

    setPassword(shuffled);
    setConfirmPassword(shuffled);
  };

  const passwordChecks = getPasswordChecks(password);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full max-w-xl flex-col gap-6 md:min-h-[40.5dvh]"
    >
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> indicates a required field
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Your password</p>

        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="onboarding-password">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 left-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Eye className="h-4 w-4" />
              </button>
              <Input
                id="onboarding-password"
                type={showPassword ? "text" : "password"}
                className="bg-background pl-9 pr-9"
                autoComplete="new-password"
                value={password}
                onChange={handlePasswordChange}
              />
              <button
                type="button"
                onClick={generatePassword}
                className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Generate secure password"
              >
                <Dice5 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Your password should contain at least:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs">
            <li className={passwordChecks.hasMinLength ? "text-emerald-500" : "text-muted-foreground"}>
              8 characters
            </li>
            <li className={passwordChecks.hasUppercase ? "text-emerald-500" : "text-muted-foreground"}>
              1 capital letter
            </li>
            <li className={passwordChecks.hasNumber ? "text-emerald-500" : "text-muted-foreground"}>
              1 number
            </li>
            <li className={passwordChecks.hasSpecial ? "text-emerald-500" : "text-muted-foreground"}>
              1 special character (for example: !, ?, , , &amp;)
            </li>
          </ul>
        </div>

        <div className="space-y-1">
          <Label htmlFor="onboarding-confirm-password">
            Confirm password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 left-2 flex items-center text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              <Eye className="h-4 w-4" />
            </button>
            <Input
              id="onboarding-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className="bg-background pl-9"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Lifely terms &amp; conditions</p>
        <p className="text-xs text-muted-foreground">
          To finish setting up your account, you must read and acknowledge our{" "}
          <a href="/terms" className="underline">
            Terms &amp; Conditions
          </a>{" "}
          along with our{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          .
        </p>

        <label className="flex cursor-pointer items-start gap-2">
          <Checkbox
            id="onboarding-accept-terms"
            checked={acceptedTerms}
            onCheckedChange={handleAcceptTermsChange}
            className="mt-0.5 h-4 w-4 rounded-sm border border-border bg-background text-primary shadow-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <span className="text-xs text-foreground">
            I agree to the Lifely Terms &amp; Conditions and Privacy Policy{" "}
            <span className="text-destructive">*</span>
          </span>
        </label>
      </div>
    </form>
  );
};

const StepFourComponent = () => {
  return null; // Компонент не используется, так как Step 4 показывается полноэкранно
};

const StepFourSecondaryCta = () => {
  return (
    <Button className="w-full" size="lg">
      Get the Extension
    </Button>
  );
};

const StepFourCta = ({ onClick, disabled }: StepCtaProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Maybe Later
    </button>
  );
};

const StepFiveComponent = () => {
  const premiumFeatures = [
    {
      icon: LayoutGrid,
      title: "Custom Views",
      description: "Organize your data exactly how you want it",
    },
    {
      icon: Workflow,
      title: "Automation",
      description: "Set up triggers and actions to save time",
    },
    {
      icon: Chrome,
      title: "Web Clipper",
      description: "Save contacts from any website instantly",
    },
    {
      icon: Sparkles,
      title: "AI Insights",
      description: "Get smart suggestions and auto-complete data",
    },
    {
      icon: Puzzle,
      title: "App Connections",
      description: "Sync with 2000+ tools you already use",
    },
    {
      icon: Star,
      title: "Priority Support",
      description: "Dedicated help and onboarding assistance",
    },
  ];

  return (
    <ul className="space-y-4 md:space-y-6">
      {premiumFeatures.map((feature) => (
        <li key={feature.title} className="flex items-start gap-2">
          <feature.icon className="mt-0.5 size-5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm leading-tight font-medium md:text-base">
              {feature.title}
            </p>
            <p className="text-xs text-muted-foreground md:text-sm">
              {feature.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

const StepFiveCta = ({ onClick, disabled }: StepCtaProps) => {
  return (
    <Button className="w-full" size="lg" onClick={onClick} disabled={disabled}>
      Activate Trial
    </Button>
  );
};

const SuccessScreenComponent = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="flex w-full max-w-xl flex-col items-center justify-center space-y-6 rounded-lg bg-background p-8 shadow-lg">
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          Your Lifely account is ready
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          You can now log in and begin using everything that lifely has to offer on your path to better health.
        </p>
      </div>

      <div className="w-full space-y-4">
        <h3 className="text-lg font-semibold text-foreground">What&apos;s next?</h3>
        <p className="text-sm text-muted-foreground">
          We can help personalize your experience with Lifely with answering a few more questions. Or, if you&apos;d like to jump in and begin immediately, you can answer those questions later.
        </p>
      </div>

      <div className="flex w-full gap-3">
        <Button
          className="flex-1"
          size="lg"
          onClick={onClick}
        >
          Personalize my Lifely
        </Button>
        <Button
          className="flex-1"
          size="lg"
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
        >
          Go to my account
        </Button>
      </div>
    </div>
  );
};

const PersonalizeStepOneComponent = () => {
  const items = [
    {
      title: "Basic demographic information",
      description: "Your photo, gender, race, and pronouns",
    },
    {
      title: "Your skillset as a mentor",
      description: "Your perspective and approach to helping mentees",
    },
    {
      title: "Your schedule",
      description: "You can work as much as you want on your terms",
    },
    {
      title: "How you want to be paid",
      description: "We offer a variety of ways to pay you for your time",
    },
    {
      title: "Agree to our code of conduct",
      description: "We’ll want to set you up for success on Lifely",
    },
    {
      title: "Check that we got it right",
      description: "When everything is how you like it, you’ll be ahead of the game",
    },
  ];

  return (
    <div className="w-full max-w-xl space-y-4 md:min-h-[40.5dvh]">
      <h3 className="text-base font-semibold md:text-lg">What we will ask you</h3>

      <ol className="space-y-4">
        {items.map((item, index) => (
          <li key={item.title} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary text-sm font-semibold text-primary">
              {index + 1}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold md:text-base">{item.title}</p>
              <p className="text-xs text-muted-foreground md:text-sm">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Other"] as const;
const PRONOUN_OPTIONS = ["He/him", "She/her", "They/them", "Other"] as const;
const ETHNICITY_OPTIONS = [
  "African American",
  "Asian",
  "American Indian or Alaska Native",
  "Caucasian or white",
  "Hispanic",
  "Hawaiian or other Pacific Islander",
  "Other",
] as const;

const PersonalizeStepTwoComponent = ({
  data,
  onDataChange,
}: StepComponentProps) => {
  const saved = data?.personalizeStep2;
  const [gender, setGender] = useState(saved?.gender ?? "");
  const [pronouns, setPronouns] = useState(saved?.pronouns ?? "");
  const [ethnicity, setEthnicity] = useState(saved?.ethnicity ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(saved?.photoDataUrl ?? null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(saved?.photoDataUrl);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onDataChange?.("personalizeStep2", {
      gender,
      pronouns,
      ethnicity,
      photoDataUrl: photoDataUrl ?? undefined,
    });
  }, [gender, pronouns, ethnicity, photoDataUrl, onDataChange]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setPhotoDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoDataUrl(undefined);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full max-w-xl flex-col gap-6 md:min-h-[40.5dvh]"
    >
      <p className="text-xs text-muted-foreground">
        <span className="text-destructive">*</span> indicates a required field
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Gender <span className="text-destructive">*</span>
          </Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Pronouns <span className="text-destructive">*</span>
          </Label>
          <Select value={pronouns} onValueChange={setPronouns}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select pronouns" />
            </SelectTrigger>
            <SelectContent>
              {PRONOUN_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>
            Ethnicity <span className="text-destructive">*</span>
          </Label>
          <Select value={ethnicity} onValueChange={setEthnicity}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select ethnicity" />
            </SelectTrigger>
            <SelectContent>
              {ETHNICITY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>
          Your photo <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Your photo is what you use to help potential matches get a feel of you, your
          personality, and your overall vibe. Choose a photo that best represents you
          professionally and makes you stand out to those who need help.
        </p>
        <div className="flex flex-col items-center gap-3">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Select photo"
            onChange={handlePhotoChange}
          />
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Your photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => photoInputRef.current?.click()}
            >
              {photoPreview ? "Change photo" : "Select photo"}
            </Button>
            {photoPreview && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

const PersonalizeStepThreeComponent = () => {
  const [skills, setSkills] = useState("");
  const [pitch, setPitch] = useState("");
  const maxPitchLength = 256;
  const remaining = Math.max(0, maxPitchLength - pitch.length);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full max-w-xl flex-col gap-6 md:min-h-[40.5dvh]"
    >
      <p className="text-xs text-muted-foreground">
        <span className="text-destructive">*</span> indicates a required field
      </p>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="mentor-skills">
            Your skills & talents <span className="text-destructive">*</span>
          </Label>
        </div>
        <Input
          id="mentor-skills"
          className="bg-background"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Enter qualities that make you a great mentor, like listening, coaching, empathy,
          leadership, and other aspects of you that would be appealing to a potential match.
          We will build a list for you to showcase your best self.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="mentor-pitch">
            Your pitch to members <span className="text-destructive">*</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {remaining} characters remaining
          </span>
        </div>
        <Textarea
          id="mentor-pitch"
          className="min-h-[140px] bg-background resize-none"
          maxLength={maxPitchLength}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Think of this as your secret sauce to creatively appeal to people on Lifely. Try
          something like &quot;My goal is to help you be not afraid of living with
          diabetes.&quot; and not &quot;I am a great mentor.&quot;
        </p>
      </div>
    </form>
  );
};

const STRIPE_LEARN_MORE_URL = "https://stripe.com";

const PersonalizeStepFourComponent = () => {
  return (
    <div className="w-full max-w-xl space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm md:min-h-[40.5dvh]">
      <img
        src="https://stripe.com/img/v3/payments/badges/stripe.svg"
        alt="Stripe"
        className="h-7 w-auto"
      />
      <h3 className="text-lg font-semibold text-foreground">
        We partner with Stripe to safeguard your money
      </h3>
      <p className="text-sm text-muted-foreground">
        Lifely partners with Stripe to connect your banking information and process payments for
        your time with us. We do not store your banking information, but rather store an anonymized
        connection with Stripe. That way, you get your money securely, and safely.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="default">
          Connect with Stripe now
        </Button>
        <a
          href={STRIPE_LEARN_MORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Learn more about Stripe
        </a>
      </div>
    </div>
  );
};

const PersonalizeStepFiveComponent = () => {
  return (
    <div className="w-full max-w-xl space-y-3 md:min-h-[40.5dvh]">
      <p className="text-sm text-muted-foreground">Personalize step 5</p>
    </div>
  );
};

const PersonalizeStepSixComponent = () => {
  return (
    <div className="w-full max-w-xl space-y-3 md:min-h-[40.5dvh]">
      <p className="text-sm text-muted-foreground">Personalize step 6</p>
    </div>
  );
};

interface Onboarding2Props {
  steps?: StepDef[];
  className?: string;
}

const Onboarding2 = ({
  steps = [
    {
      stepLabel: "Step 1 of 3",
      title: "Welcome to Lifely.",
      description: "We are happy you are here.",
      className: "bg-orange-200",
      isBlocking: true,
      component: StepOneComponent,
    },
    {
      stepLabel: "Step 2 of 3",
      title: "Let’s get to know you",
      description:
        "We ask for this information to work with you on your terms. We secure all of your information in accordance with our Privacy Policy.",
      className: "bg-blue-200",
      isBlocking: true,
      component: StepTwoComponent,
    },
    {
      stepLabel: "Step 3 of 3",
      title: "Let’s secure your account",
      description:
        "We ask you to do so to help us keep your personal and medical information secure.",
      className: "bg-pink-200",
      isBlocking: true,
      component: StepThreeComponent,
    },
    {
      title: "Your Lifely account is ready",
      description: "You can now log in and begin using everything that lifely has to offer on your path to better health.",
      className: "bg-white",
      component: StepFourComponent,
    },
    {
      title: "Unlock the full experience",
      description:
        "Start your 14-day trial and explore every feature. No credit card required.",
      className: "bg-purple-200",
      component: StepFiveComponent,
      cta: StepFiveCta,
    },
  ],
  className,
}: Onboarding2Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPersonalizePhase, setIsPersonalizePhase] = useState(false);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>(
    {},
  );
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>(() => loadOnboardingData());

  const personalizeSteps: StepDef[] = [
    {
      stepLabel: "Step 1 of 6",
      title: "Let's personalize your Lifely experience",
      description:
        "Lifely is your place to learn, grow, and become your best self. To help us help you to do our best, we need to understand a few things about you to give you the best experience here. This should only take a few minutes of your time.",
      className: "bg-green-200",
      component: PersonalizeStepOneComponent,
    },
    {
      stepLabel: "Step 2 of 6",
      title: "What demographics do you identify",
      description:
        "We ask this to ensure that you and others are treated respectfully and the way you want to on Lifely.",
      className: "bg-yellow-200",
      component: PersonalizeStepTwoComponent,
    },
    {
      stepLabel: "Step 3 of 6",
      title: "What are your skills as a mentor?",
      description:
        "We want to highlight your skills and strengths to potential mentees of yours.",
      className: "bg-indigo-200",
      component: PersonalizeStepThreeComponent,
    },
    {
      stepLabel: "Step 4 of 6",
      title: "How would you like to be paid for your time?",
      description:
        "We want to make sure you get paid for your time and assistance you give to our members.",
      className: "bg-teal-200",
      component: PersonalizeStepFourComponent,
    },
    {
      stepLabel: "Step 5 of 6",
      title: "Personalize step 5",
      description: "Continue personalization.",
      className: "bg-rose-200",
      component: PersonalizeStepFiveComponent,
    },
    {
      stepLabel: "Step 6 of 6",
      title: "Personalize step 6",
      description: "Final step of personalization.",
      className: "bg-cyan-200",
      component: PersonalizeStepSixComponent,
    },
  ];

  const allSteps = [...steps, ...personalizeSteps];

  useEffect(() => {
    const saved = loadOnboardingData();
    if (Object.keys(saved).length > 0) {
      setOnboardingData(saved);
    }
  }, []);

  const handleStepValidChange = useCallback((stepIndex: number, isValid: boolean) => {
    setStepValidation((prev) => ({ ...prev, [stepIndex]: isValid }));
  }, []);

  const handleDataChange = useCallback((step: keyof OnboardingData, newData: Partial<OnboardingData[keyof OnboardingData]>) => {
    setOnboardingData((prev) => {
      const currentStepData = prev[step] || {};
      const stepDataString = JSON.stringify(currentStepData);
      const newDataString = JSON.stringify({ ...currentStepData, ...newData });
      
      if (stepDataString === newDataString) {
        return prev;
      }
      
      const updated = {
        ...prev,
        [step]: { ...currentStepData, ...newData },
      };
      saveOnboardingData(updated);
      return updated;
    });
  }, []);

  const canProceed = useCallback(() => {
    const currentStepDef = allSteps[currentStep];

    if (!currentStepDef.component || !currentStepDef.isBlocking) return true;

    return stepValidation[currentStep] === true;
  }, [currentStep, stepValidation, allSteps]);

  const handleNext = () => {
    if (currentStep === 3) {
      // Step 4 - переход к персонализации
      setIsPersonalizePhase(true);
      setCurrentStep(steps.length);
    } else {
      const activeSteps = isPersonalizePhase ? personalizeSteps : steps;
      const baseOffset = isPersonalizePhase ? steps.length : 0;
      
      if (currentStep < baseOffset + activeSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (isPersonalizePhase && currentStep === steps.length) {
      setIsPersonalizePhase(false);
      setCurrentStep(3);
    } else {
      const baseOffset = isPersonalizePhase ? steps.length : 0;
      if (currentStep > baseOffset) {
        setCurrentStep(currentStep - 1);
      } else if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const getActiveSteps = () => {
    if (currentStep < steps.length) {
      return steps;
    } else {
      return personalizeSteps;
    }
  };

  const getStepIndicatorConfig = () => {
    if (currentStep < 3) {
      // Для первых трёх шагов показываем только 3 точки
      return { totalSteps: 3, currentStep, showOnlyFirst: 3 };
    } else if (currentStep === 3) {
      // Step 4 (экран успеха) - не показываем индикатор
      return { totalSteps: 0, currentStep: 0 };
    } else {
      return { 
        totalSteps: personalizeSteps.length, 
        currentStep: currentStep - steps.length,
      };
    }
  };

  const activeSteps = getActiveSteps();
  const step = allSteps[currentStep];
  const indicatorConfig = getStepIndicatorConfig();

  return (
    <section>
      <Background />

      <Dialog open={true}>
        <DialogContent
          className={cn(
            "flex max-h-dvh items-center justify-center overflow-y-auto rounded-none p-0 md:max-w-3xl md:items-stretch md:overflow-hidden lg:max-w-5xl",
            className,
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Onboarding</DialogTitle>
            <DialogDescription>Onboarding Dialog</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-[60dvh] w-full flex-col-reverse items-start tracking-tighter md:h-[550px] md:flex-row">
            {currentStep === 3 ? (
              <div className="flex h-full w-full items-center justify-center p-6 lg:p-12">
                <SuccessScreenComponent onClick={() => {
                  setIsPersonalizePhase(true);
                  setCurrentStep(steps.length);
                }} />
              </div>
            ) : (
              <>
                <div className="flex h-full w-full flex-col justify-between gap-4 p-6 pb-6 md:flex-[45%] md:gap-6 lg:p-12">
                  <div className="space-y-2">
                    <FadeContainer condition={currentStep > 0 || isPersonalizePhase}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevious}
                        disabled={currentStep === 0 && !isPersonalizePhase}
                      >
                        <ChevronLeftIcon />
                        Back
                      </Button>
                    </FadeContainer>
                    <StepDescriptionCard
                      title={step.title}
                      description={step.description}
                      stepLabel={step.stepLabel}
                    />
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                      {step.secondaryCta && <step.secondaryCta />}
                      {step.cta ? (
                        <step.cta onClick={handleNext} disabled={!canProceed()} />
                      ) : (
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleNext}
                          disabled={
                            (isPersonalizePhase && currentStep === steps.length + personalizeSteps.length) ||
                            (!isPersonalizePhase && currentStep === steps.length - 1) ||
                            !canProceed()
                          }
                        >
                          Next
                        </Button>
                      )}
                    </div>

                    {indicatorConfig.totalSteps > 0 && (
                      <StepIndicator
                        totalSteps={indicatorConfig.totalSteps}
                        currentStep={indicatorConfig.currentStep}
                        showOnlyFirst={indicatorConfig.showOnlyFirst}
                      />
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "flex h-full w-full flex-[55%] shrink-0 items-center justify-center p-6 transition-colors lg:p-12",
                    step.className || "bg-foreground/30",
                  )}
                >
                  <step.component
                    stepIndex={currentStep}
                    onValidationChange={handleStepValidChange}
                    data={onboardingData}
                    onDataChange={handleDataChange}
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

const OnboardingMemberPage = () => {
  return <Onboarding2 />;
};

export default OnboardingMemberPage;
export { Onboarding2 };
