import { useEffect, useState } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type PersonNameFormValues = {
  firstName?: string;
  lastName?: string;
  name2First?: string;
  name2Last?: string;
  name3First?: string;
  name3Last?: string;
};

interface PersonNameFormFieldsProps {
  register: UseFormRegister<PersonNameFormValues>;
  setValue: UseFormSetValue<PersonNameFormValues>;
  errors: FieldErrors<PersonNameFormValues>;
  /** When true, show name 2/3 tiers if they have saved data */
  showSavedTiers?: boolean;
  hasName2Data?: boolean;
  hasName3Data?: boolean;
}

function NamePair({
  firstId,
  lastId,
  register,
  firstPlaceholder = "First name",
  lastPlaceholder = "Last name",
}: {
  firstId: keyof PersonNameFormValues;
  lastId: keyof PersonNameFormValues;
  register: UseFormRegister<PersonNameFormValues>;
  firstPlaceholder?: string;
  lastPlaceholder?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input id={firstId} placeholder={firstPlaceholder} {...register(firstId)} />
      <Input id={lastId} placeholder={lastPlaceholder} {...register(lastId)} />
    </div>
  );
}

export function PersonNameFormFields({
  register,
  setValue,
  errors,
  showSavedTiers = false,
  hasName2Data = false,
  hasName3Data = false,
}: PersonNameFormFieldsProps) {
  const [showName2, setShowName2] = useState(false);
  const [showName3, setShowName3] = useState(false);

  useEffect(() => {
    if (showSavedTiers) {
      setShowName2(hasName2Data);
      setShowName3(hasName3Data);
    } else {
      setShowName2(false);
      setShowName3(false);
    }
  }, [showSavedTiers, hasName2Data, hasName3Data]);

  const removeName2 = () => {
    setValue("name2First", "");
    setValue("name2Last", "");
    setShowName2(false);
    if (showName3) {
      setValue("name3First", "");
      setValue("name3Last", "");
      setShowName3(false);
    }
  };

  const removeName3 = () => {
    setValue("name3First", "");
    setValue("name3Last", "");
    setShowName3(false);
  };

  return (
    <div className="space-y-3">
      <NamePair firstId="firstName" lastId="lastName" register={register} />
      {errors.firstName && (
        <p className="text-xs text-destructive">{errors.firstName.message}</p>
      )}

      {showName2 && (
        <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Name 2</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground"
              onClick={removeName2}
              aria-label="Remove name 2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <NamePair firstId="name2First" lastId="name2Last" register={register} />
        </div>
      )}

      {showName3 && (
        <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Name 3</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground"
              onClick={removeName3}
              aria-label="Remove name 3"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <NamePair firstId="name3First" lastId="name3Last" register={register} />
        </div>
      )}

      {(!showName2 || !showName3) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-muted-foreground"
          onClick={() => {
            if (!showName2) setShowName2(true);
            else if (!showName3) setShowName3(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          {!showName2 ? "Add name 2" : "Add name 3"}
        </Button>
      )}
    </div>
  );
}
