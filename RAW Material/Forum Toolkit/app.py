import os
import re
import string # Keep for potential future use, though not strictly needed now

def sanitize_filename(name):
    """Removes or replaces characters invalid for filenames."""
    # Remove leading/trailing whitespace
    name = name.strip()
    # Remove the leading '#' and any space after it if present (from heading)
    if name.startswith('#'):
        name = name.lstrip('#').strip()

    # Allow specific characters like '.', '-', '_' and alphanumeric
    # Remove or replace anything else
    # Keep periods but ensure they aren't leading/trailing and not consecutive
    name = re.sub(r'^\.+|\.+$|\.+(\.)', r'\1', name) # Handle leading/trailing/consecutive dots
    name = re.sub(r'[\\/*?:"<>|]+', '', name) # Remove definitely invalid chars
    name = re.sub(r'\s+', '_', name) # Replace whitespace with underscore

    # Limit length (optional, uncomment if needed)
    # max_len = 100
    # name = name[:max_len]

    # Final check for empty or problematic names
    if not name or name == '.':
        return None # Indicate an invalid filename resulted

    return name

def process_markdown_file(md_filepath, base_output_dir):
    """Processes a single markdown file."""
    try:
        with open(md_filepath, 'r', encoding='utf-8') as f_md:
            content_md = f_md.read()
    except IOError as e:
        print(f"Error reading file {md_filepath}: {e}")
        return
    except Exception as e:
        print(f"An unexpected error occurred reading {md_filepath}: {e}")
        return

    # --- Create Output Folder ---
    # Get the filename without extension
    base_name, _ = os.path.splitext(os.path.basename(md_filepath))
    output_folder = os.path.join(base_output_dir, base_name)
    try:
        os.makedirs(output_folder, exist_ok=True)
        print(f"\nProcessing '{os.path.basename(md_filepath)}' -> Output folder: '{output_folder}'")
    except OSError as e:
        print(f"Error creating folder {output_folder}: {e}")
        return
    except Exception as e:
        print(f"An unexpected error occurred creating folder {output_folder}: {e}")
        return

    # --- Revised Regex Pattern ---
    # Explanation:
    # ^#\s+(.*?)\s*$             : Match line starting with # (Heading 1), capture heading text (Group 1)
    # \s*                       : Match optional whitespace (including newlines) between heading and code fence
    # ```(?:\w*\s*)?            : Match opening ```, optionally followed by language ID (like 'markdown') and spaces (non-capturing group)
    # \s*?\n                    : Match optional spaces/tabs after the language ID (non-greedy), then a mandatory newline
    # (.*?)                     : Capture the content inside the code block (Group 2) - non-greedy, dot matches newline
    # \s*?\n```                 : Match optional whitespace/newlines (non-greedy), then a newline, then the closing ```
    pattern = re.compile(
        r"^#\s+(.*?)\s*$"           # Capture heading text (Group 1)
        r"\s*```(?:\w*\s*)?"        # Match opening ``` optionally followed by language ID
        r"\s*?\n"                   # Optional spaces then newline
        r"(.*?)"                    # Capture code block content (Group 2)
        r"\s*?\n```",               # Optional whitespace/newline then closing ```
        re.MULTILINE | re.DOTALL
    )

    matches = pattern.findall(content_md)

    if not matches:
        print(f"  No matching heading/code block sections found in {os.path.basename(md_filepath)} using the pattern.")
        # Attempt a slightly simpler pattern just in case
        alt_pattern = re.compile(
             r"^#\s+(.*?)\s*$"      # Heading
             r"\s*```\s*\n"         # Simple ``` fence start
             r"(.*?)"               # Content
             r"\s*\n```",           # Simple ``` fence end
             re.MULTILINE | re.DOTALL
        )
        matches = alt_pattern.findall(content_md)
        if not matches:
             print(f"  Also failed with simpler pattern in {os.path.basename(md_filepath)}")
             return
        else:
             print(f"  Success using simpler pattern for {os.path.basename(md_filepath)}")


    # --- Process each match ---
    file_count = 0
    for heading, code_content in matches:
        heading_clean = heading.strip()
        code_content_clean = code_content.strip() # Clean the captured content

        # Sanitize heading for filename
        txt_filename_base = sanitize_filename(heading_clean)
        if not txt_filename_base: # Handle cases where sanitization results in an empty or invalid name
            print(f"  Skipping section with unusable heading: '{heading_clean}'")
            continue

        txt_filename = f"{txt_filename_base}.txt"
        txt_filepath = os.path.join(output_folder, txt_filename)

        # Write content to the corresponding txt file
        try:
            with open(txt_filepath, 'w', encoding='utf-8') as f_txt:
                f_txt.write(code_content_clean)
            # print(f"  Created: {txt_filepath}") # Reduced verbosity
            file_count += 1
        except IOError as e:
            print(f"  Error writing file {txt_filepath}: {e}")
        except OSError as e:
             print(f"  Error with file path (check filename length/chars) {txt_filepath}: {e}")

    print(f"  Successfully created {file_count} .txt files for {os.path.basename(md_filepath)}")


def main():
    """Main function to set input directory and process files."""
    # Use a raw string (r"...") for Windows paths
    input_directory = r"C:\Users\FO\Desktop\New folder" # Use your actual path

    if not os.path.isdir(input_directory):
        print(f"Error: Input directory '{input_directory}' not found.")
        return

    # Iterate through all files in the input directory
    processed_files = 0
    for filename in os.listdir(input_directory):
        if filename.lower().endswith(".md"):
            md_filepath = os.path.join(input_directory, filename)
            # Process each markdown file found
            process_markdown_file(md_filepath, input_directory)
            processed_files += 1

    if processed_files == 0:
        print(f"No .md files found in '{input_directory}'")
    else:
        print(f"\nProcessing complete. Processed {processed_files} markdown file(s).")

if __name__ == "__main__":
    main()