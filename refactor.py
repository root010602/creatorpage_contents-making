import re

def main():
    with open('src/app/manage/page.tsx', 'r', encoding='utf-8') as f:
        src = f.read()

    # Extracted part 1: Form state
    state_start_idx = src.find('    // Multi-step Registration State')
    state_end_idx = src.find('    // Pagination state (for management list)')
    if state_start_idx == -1 or state_end_idx == -1:
        print("Failed to find state boundaries.")
        return
    form_state_code = src[state_start_idx:state_end_idx].rstrip()

    # Extracted part 2: Handlers
    handler_start_idx = src.find('    const handleStepChange = (stepId: number) => {')
    handler_end_idx = src.find('    const tabs = [')
    if handler_start_idx == -1 or handler_end_idx == -1:
        print("Failed to find handler boundaries.")
        return
    form_handler_code = src[handler_start_idx:handler_end_idx].rstrip()

    # Replace fetchContents with onRefresh inside form_handler_code
    form_handler_code = form_handler_code.replace('await fetchContents();', 'await onRefresh();')

    # Extracted part 3: JSX
    form_start_str = '                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">'
    form_end_str = '                        </div>\n                    ) : (\n                        contents.length > 0 ? ('
    
    form_start_idx = src.find(form_start_str)
    form_end_idx = src.find(form_end_str)
    if form_start_idx == -1 or form_end_idx == -1:
        print("Failed to find JSX boundaries.")
        return
    form_jsx = src[form_start_idx:form_end_idx].rstrip()

    # Replace specific onClick handlers
    form_jsx = form_jsx.replace('onClick={() => setView("base")}', 'onClick={onBack}')
    form_jsx = form_jsx.replace('onClick={() => setView("list")}', 'onClick={onList}')

    content_reg_form = """"use client";

import React, { useState } from "react";
import {
    Plus,
    FileText,
    CheckCircle2,
    Edit2,
    Search,
    ChevronDown,
    Globe,
    BookOpen,
    PlayCircle,
    ImageIcon,
    Layers,
    XCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ContentPayload {
    id?: string | number;
    title: string;
    type: string;
    category: string;
    city: string;
    description: string;
    museum_name: string;
    museum_link: string;
    map_type: string;
    price: string | null;
    thumbnail_url: string | null;
    gallery_urls: string[] | null;
    epub_url: string | null;
    status: string;
    updated_at: string;
}

interface ContentRegistrationFormProps {
    onBack: () => void;
    onList: () => void;
    onRefresh: () => Promise<void>;
}

export default function ContentRegistrationForm({ onBack, onList, onRefresh }: ContentRegistrationFormProps) {
    const [loading, setLoading] = useState(false);
""" + f"\n{form_state_code}\n\n{form_handler_code}\n" + """
    return (
""" + f"{form_jsx}" + """
    );
}
"""
    # write component
    with open('src/components/ContentRegistrationForm.tsx', 'w', encoding='utf-8') as f:
        f.write(content_reg_form)

    # replace page.tsx
    # first, remove the state and handler code
    new_src = src[:state_start_idx] + src[state_end_idx:handler_start_idx] + src[handler_end_idx:]

    # recompute the bounding strings in new_src for jsx
    form_start_idx = new_src.find(form_start_str)
    form_end_idx = new_src.find(form_end_str)

    component_call = '                        <ContentRegistrationForm onBack={() => setView("base")} onList={() => setView("list")} onRefresh={fetchContents} />'

    new_src = new_src[:form_start_idx] + component_call + '\n' + new_src[form_end_idx:]

    # insert import
    supabase_import_idx = new_src.find('import { supabase } from "@/lib/supabase";') + len('import { supabase } from "@/lib/supabase";')
    
    import_str = '\nimport ContentRegistrationForm from "@/components/ContentRegistrationForm";'
    new_src = new_src[:supabase_import_idx] + import_str + new_src[supabase_import_idx:]

    with open('src/app/manage/page.tsx', 'w', encoding='utf-8') as f:
        f.write(new_src)
        
    print("Refactor complete.")

if __name__ == "__main__":
    main()
