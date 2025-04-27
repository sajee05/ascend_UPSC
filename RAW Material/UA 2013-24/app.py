import os
import re
import sys

# --- Configuration ---
# Use raw strings (r"...") for Windows paths to avoid issues with backslashes
markdown_file_path = r"C:\Users\FO\Desktop\New folder\13-24-PYQs.md"
output_base_directory = r"C:\Users\FO\Desktop\New folder"
# --- End Configuration ---

# Regex to capture: 1:Number, 2:Subject, 3:Topic, 4:Question Count
heading_pattern = re.compile(
    r"^\s*#\s*(\d+\.\d+)\s+(.+?)\s+-\s+(.+?)\s+\((\d+)\s+Questions\)\s*$"
)

# Windows invalid filename characters: < > : " / \ | ? *
# We will replace them with underscores or hyphens. Colon is the immediate issue.
invalid_filename_chars = r'[<>:"/\\|?*]'
invalid_foldername_chars = r'[<>:"/\\|?*]' # Same for folders

# Check if input file exists
if not os.path.exists(markdown_file_path):
    print(f"Error: Markdown file not found at '{markdown_file_path}'")
    sys.exit(1) # Exit the script if file not found

# Ensure base output directory exists
os.makedirs(output_base_directory, exist_ok=True)
print(f"Base output directory: '{output_base_directory}'")

headings_found = 0
code_blocks_processed = 0
files_written = 0
warnings = []

try:
    with open(markdown_file_path, 'r', encoding='utf-8') as md_file:
        lines = md_file.readlines()

    i = 0
    while i < len(lines):
        line = lines[i]
        heading_match = heading_pattern.match(line.strip())

        if heading_match:
            headings_found += 1
            section_number = heading_match.group(1)
            subject_original = heading_match.group(2).strip()
            topic_original = heading_match.group(3).strip()
            question_count = heading_match.group(4)

            print(f"\nFound Heading (Line {i+1}): {subject_original} - {topic_original}")

            # --- Sanitize Subject for Folder Name ---
            sanitized_subject = re.sub(invalid_foldername_chars, '_', subject_original)

            # --- Sanitize Topic for Filename ---
            # Replacing colon specifically first, then others
            sanitized_topic = topic_original.replace(":", "-") # Replace colon with hyphen
            sanitized_topic = re.sub(invalid_filename_chars, '_', sanitized_topic) # Replace any remaining invalid chars with underscore


            # --- Find the start of the immediate next code block ---
            code_block_start_index = -1
            j = i + 1
            while j < len(lines):
                # Allow skipping blank lines between heading and code block
                if lines[j].strip() == "":
                    j += 1
                    continue
                # Check if this line is the start delimiter
                if lines[j].strip() == '```':
                    code_block_start_index = j
                    # print(f"  Found code block start at Line {j+1}")
                    break
                else:
                    # If the next non-blank line isn't ```, assume no code block for this heading
                    warnings.append(f"  Warning: Heading at Line {i+1} ('{subject_original} - {topic_original}') not immediately followed by a code block.")
                    break
            # If we reached end of file without finding start delimiter
            if j == len(lines) and code_block_start_index == -1:
                 warnings.append(f"  Warning: Reached end of file searching for code block start after heading at Line {i+1} ('{subject_original} - {topic_original}').")


            # --- If code block start found, find the end and extract content ---
            if code_block_start_index != -1:
                code_blocks_processed += 1
                code_block_end_index = -1
                current_content = []
                k = code_block_start_index + 1
                while k < len(lines):
                    if lines[k].strip() == '```':
                        code_block_end_index = k
                        # print(f"  Found code block end at Line {k+1}")
                        break
                    current_content.append(lines[k]) # Append the original line with newline
                    k += 1

                if code_block_end_index != -1:
                    # --- Create folder and file ---
                    try:
                        # Create subject folder using sanitized name
                        subject_folder_path = os.path.join(output_base_directory, sanitized_subject)
                        os.makedirs(subject_folder_path, exist_ok=True)
                        # print(f"  Ensured folder exists: '{subject_folder_path}'")

                        # Construct output filename using sanitized topic
                        output_filename = f"UA {section_number} {sanitized_topic} ({question_count} Questions).txt"
                        output_file_path = os.path.join(subject_folder_path, output_filename)

                        # Write content to file
                        with open(output_file_path, 'w', encoding='utf-8') as out_file:
                            out_file.write("".join(current_content)) # Join lines back, preserving structure

                        print(f"  Successfully wrote: '{os.path.basename(output_file_path)}'")
                        files_written += 1

                        # --- IMPORTANT: Advance main loop index past this processed block ---
                        i = code_block_end_index # Next iteration will start after ```

                    except IOError as e:
                        warnings.append(f"  Error writing file for heading at Line {i+1}: {e}")
                    except Exception as e:
                        warnings.append(f"  Unexpected error processing block for heading at Line {i+1}: {e}")

                else:
                    warnings.append(f"  Warning: Code block starting at Line {code_block_start_index+1} seems unclosed (reached end of file).")
                    # Advance past the heading anyway
                    i += 1
            else:
                 # If no code block start was found, just advance past the heading
                 i += 1
        else:
            # Not a heading line, just move to the next line
            i += 1

except FileNotFoundError:
    print(f"Error: Could not open the markdown file '{markdown_file_path}'")
except Exception as e:
    print(f"An unexpected error occurred during processing: {e}")

print(f"\n--- Script Finished ---")
print(f"Total Headings Found: {headings_found}")
print(f"Code Blocks Processed: {code_blocks_processed}")
print(f"Files Written: {files_written}")

if warnings:
    print("\nWarnings Encountered:")
    for warning in warnings:
        print(warning)

# Sanity check
if headings_found != files_written or headings_found != code_blocks_processed:
    print(f"\nNotice: Mismatch detected - Headings ({headings_found}), Processed Blocks ({code_blocks_processed}), Files Written ({files_written}). Check warnings above and review input file format.")