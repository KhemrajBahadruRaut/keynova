"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  App,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
  Upload,
  type ButtonProps,
  type CardProps,
  type InputRef,
  type TableProps,
} from "antd";
import { Upload as UploadIcon } from "lucide-react";
import { editPhoneNumber, formatPhoneNumber } from "@/lib/phone";

function controlLayout(className = "") {
  return className.split(/\s+/).filter((token) =>
    /^(?:(?:sm|md|lg|xl|2xl):)?(?:w-|min-w-|max-w-|m[trblxyse]?-|flex(?:-|$)|grow|shrink|col-|row-|block$|inline-flex$|inline-block$|hidden$|self-|gap-|order-)/.test(token),
  ).join(" ");
}

function invalid(value: InputHTMLAttributes<HTMLInputElement>["aria-invalid"]) {
  return value === true || value === "true";
}

type AdminButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  variant?: ButtonProps["type"];
  loading?: boolean;
  danger?: boolean;
};

export function AdminButton({
  type = "button", className = "", variant, danger, children, ...props
}: AdminButtonProps) {
  const primary = /bg-\[#003251\]/.test(className);
  return (
    <Button
      {...props}
      htmlType={type}
      type={variant ?? (primary ? "primary" : "default")}
      danger={danger}
      className={controlLayout(className)}
    >
      {children}
    </Button>
  );
}

export function AdminInput({
  type = "text", size: _size, className, onChange, ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  if (type === "checkbox") {
    return (
      <Checkbox
        id={props.id}
        name={props.name}
        checked={props.checked}
        defaultChecked={props.defaultChecked}
        disabled={props.disabled}
        className={controlLayout(className)}
        onChange={(event) => {
          onChange?.(event as unknown as ChangeEvent<HTMLInputElement>);
        }}
      />
    );
  }
  const inputProps = {
    ...props,
    onChange,
    className: controlLayout(className),
    status: invalid(props["aria-invalid"]) ? "error" as const : undefined,
    style: { width: "100%", ...props.style },
  };
  return type === "password"
    ? <Input.Password {...inputProps} />
    : <Input {...inputProps} type={type} />;
}

export function AdminTextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Input.TextArea {...props} className={controlLayout(className)} status={invalid(props["aria-invalid"]) ? "error" : undefined} />;
}

type NativeOption = { value?: string | number; disabled?: boolean; label?: string; children?: ReactNode };

function selectOptions(children: ReactNode): Array<{ value: string; label: ReactNode; disabled?: boolean }> {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<NativeOption>(child)) return [];
    if (child.type === "option") {
      return [{ value: String(child.props.value ?? child.props.children ?? ""), label: child.props.children, disabled: child.props.disabled }];
    }
    return selectOptions(child.props.children);
  });
}

export function AdminSelect({
  children, value, defaultValue, className, onChange, onBlur, onFocus,
  size: _size, multiple: _multiple, ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const nativeSelect = useRef<HTMLSelectElement>(null);
  return (
    <>
      <Select
        id={props.id}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-invalid={props["aria-invalid"]}
        disabled={props.disabled}
        value={value === undefined ? undefined : String(value)}
        defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
        options={selectOptions(children)}
        className={controlLayout(className)}
        style={{ width: "100%", ...props.style }}
        status={invalid(props["aria-invalid"]) ? "error" : undefined}
        onChange={(selected) => {
          if (!nativeSelect.current) return;
          nativeSelect.current.value = selected;
          onChange?.({ target: nativeSelect.current, currentTarget: nativeSelect.current } as ChangeEvent<HTMLSelectElement>);
        }}
        onBlur={(event) => {
          if (nativeSelect.current) onBlur?.({ ...event, target: nativeSelect.current, currentTarget: nativeSelect.current });
        }}
        onFocus={(event) => {
          if (nativeSelect.current) onFocus?.({ ...event, target: nativeSelect.current, currentTarget: nativeSelect.current });
        }}
      />
      <select ref={nativeSelect} name={props.name} value={value} defaultValue={defaultValue} onChange={onChange} hidden aria-hidden="true" tabIndex={-1}>
        {children}
      </select>
    </>
  );
}

export function AdminUploadInput({
  onChange, accept, multiple, disabled, className, onClick, id, buttonLabel, loading,
  "aria-describedby": describedBy, "aria-invalid": ariaInvalid,
}: InputHTMLAttributes<HTMLInputElement> & { buttonLabel?: ReactNode; loading?: boolean }) {
  return (
    <Upload
      id={id}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      showUploadList={false}
      className={controlLayout(className).replace(/\bhidden\b/g, "")}
      beforeUpload={(file, files) => {
        if (file === files[0]) {
          const transfer = new DataTransfer();
          files.forEach((selected) => transfer.items.add(selected));
          const input = document.createElement("input");
          input.type = "file";
          input.files = transfer.files;
          onChange?.({ target: input, currentTarget: input } as ChangeEvent<HTMLInputElement>);
        }
        // Files stay in the editor's existing draft and multipart save flow.
        return Upload.LIST_IGNORE;
      }}
    >
      <Button
        disabled={disabled}
        loading={loading}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid}
        icon={<UploadIcon size={16} aria-hidden="true" />}
        onClick={onClick as ButtonProps["onClick"]}
      >
        {buttonLabel ?? (multiple ? "Choose files" : "Choose image")}
      </Button>
    </Upload>
  );
}

export function AdminForm({ onSubmit, children, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <Form {...props} layout="vertical" onSubmitCapture={onSubmit}>{children}</Form>;
}

export function AdminCard({ children, styles, className = "", ...props }: CardProps) {
  const classes = className.split(/\s+/);
  const paddingClasses = classes.filter((token) => /^(?:(?:sm|md|lg|xl|2xl):)?p[trblxyse]?-/.test(token));
  const cardClasses = classes.filter((token) => !paddingClasses.includes(token));
  const mergedStyles: CardProps["styles"] = typeof styles === "function"
    ? (info) => {
      const resolved = styles(info);
      return { ...resolved, body: { padding: 0, ...resolved?.body } };
    }
    : { ...styles, body: { padding: 0, ...styles?.body } };
  return (
    <Card {...props} className={cardClasses.join(" ")} styles={mergedStyles}>
      {paddingClasses.length ? <div className={paddingClasses.join(" ")}>{children}</div> : children}
    </Card>
  );
}

export function AdminTag({ className = "", children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  const color = /bg-\[#003251\]/.test(className) ? "#003251" : "default";
  return <Tag {...props} color={color} className={controlLayout(className)}>{children}</Tag>;
}

export function AdminNotice({ message, kind = "info" }: { message?: string | null; kind?: "success" | "error" | "info" }) {
  const { notify } = useAdminFeedback();
  const lastMessage = useRef("");

  useEffect(() => {
    if (!message) {
      lastMessage.current = "";
      return;
    }
    if (lastMessage.current === message) return;

    lastMessage.current = message;
    notify({ message, kind, duration: kind === "error" ? 6500 : 4500 });
  }, [kind, message, notify]);

  return null;
}

export function AdminLoading({ children = "Loading…", className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} role="status" className={`flex flex-col items-center gap-3 py-12 text-slate-500 ${controlLayout(className)}`}><Spin size="large" /><span>{children}</span></div>;
}

export function AdminEmpty({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={children} className={controlLayout(className)} style={{ padding: "24px 0" }} />;
}

export function AdminTable<T extends object>(props: TableProps<T>) {
  return <Table<T> size="middle" rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true, hideOnSinglePage: true }} scroll={{ x: "max-content" }} {...props} />;
}

export function AdminDialog({
  title, children, onClose, busy = false, width = 800, open = true,
}: { title: ReactNode; children: ReactNode; onClose: () => void; busy?: boolean; width?: number; open?: boolean }) {
  return (
    <Modal
      open={open}
      title={title}
      footer={null}
      width={width}
      onCancel={() => { if (!busy) onClose(); }}
      keyboard={!busy}
      mask={{ closable: !busy }}
      closable={{ disabled: busy }}
      destroyOnHidden
      style={{ top: 24 }}
      styles={{ body: { maxHeight: "calc(100dvh - 150px)", overflowY: "auto" } }}
    >
      {children}
    </Modal>
  );
}

export function useAdminFeedback() {
  const { modal, message } = App.useApp();
  const confirm = useCallback((options: {
    title: string; message: string; confirmLabel?: string; cancelLabel?: string; tone?: "default" | "danger";
  }) => new Promise<boolean>((resolve) => {
    modal.confirm({
      title: options.title,
      content: options.message,
      okText: options.confirmLabel || "Confirm",
      cancelText: options.cancelLabel || "Cancel",
      okButtonProps: { danger: options.tone === "danger" },
      onOk: () => { resolve(true); },
      onCancel: () => { resolve(false); },
    });
  }), [modal]);
  const notify = useCallback((input: string | { message: string; kind?: "success" | "error" | "info"; duration?: number }) => {
    const notice = typeof input === "string" ? { message: input } : input;
    void message.open({ content: notice.message, type: notice.kind || "info", duration: notice.duration ? notice.duration / 1000 : undefined });
  }, [message]);
  return { confirm, notify };
}

type AdminPhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "maxLength" | "size"> & {
  value: string; onValueChange: (digits: string) => void;
};

export function AdminPhoneInput({ value, onValueChange, className, ...props }: AdminPhoneInputProps) {
  const inputRef = useRef<InputRef>(null);
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current?.input;
    if (input && document.activeElement === input && pendingCaret.current !== null) input.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  });
  return (
    <Input
      {...props}
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="(774) 287-6819"
      maxLength={14}
      value={formatPhoneNumber(value)}
      className={controlLayout(className)}
      status={invalid(props["aria-invalid"]) ? "error" : undefined}
      onChange={(event) => {
        const input = event.currentTarget;
        const edit = editPhoneNumber(value, input.value, input.selectionStart ?? input.value.length, (event.nativeEvent as InputEvent).inputType);
        input.value = edit.formatted;
        input.setSelectionRange(edit.caret, edit.caret);
        pendingCaret.current = edit.caret;
        onValueChange(edit.digits);
      }}
    />
  );
}
